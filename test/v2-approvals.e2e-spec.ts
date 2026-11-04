import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model, Types } from 'mongoose';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { DataLogsService } from 'src/shared/datalogs';
import { Status as EventStatus } from 'src/shared/interfaces/event.type';
import { Status as PostStatus } from 'src/shared/interfaces/post.type';
import { ApplicationStatus, UserRole } from 'src/shared/interfaces/user.type';
import {
  Event,
  LeadCandidate,
  LeadCandidateStatus,
  LeadInvitation,
  Post,
  User,
} from 'src/shared/schema';

describe('API versioning and v2 approvals (e2e)', () => {
  let app: INestApplication;
  let models: Record<string, Model<any>>;
  let adminToken: string;

  const at = (day: number) => new Date(Date.UTC(2026, 0, day));
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const ids = {
    pendingBlog: new Types.ObjectId(),
    deletedBlog: new Types.ObjectId(),
    approvedBlog: new Types.ObjectId(),
    pendingEvent: new Types.ObjectId(),
    approvedEvent: new Types.ObjectId(),
    applicant: new Types.ObjectId(),
    nomineeUser: new Types.ObjectId(),
    invitedCandidate: new Types.ObjectId(),
    acceptedCandidate: new Types.ObjectId(),
  };

  const listRoutes = (): string[] => {
    const router = app.getHttpAdapter().getInstance().router;
    return router.stack
      .filter((layer: any) => layer.route)
      .flatMap((layer: any) =>
        Object.keys(layer.route.methods).map(
          (method) => `${method.toUpperCase()} ${layer.route.path}`,
        ),
      );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors the routing setup in src/main.ts.
    global.jwtService = app.get(JwtService);
    global.dataLogsService = app.get(DataLogsService);
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    models = {
      post: app.get(Post.name),
      event: app.get(Event.name),
      user: app.get(User.name),
      candidate: app.get(LeadCandidate.name),
      invitation: app.get(LeadInvitation.name),
    };

    adminToken = global.jwtService.sign({
      _id: new Types.ObjectId().toString(),
      role: [UserRole.ADMIN],
    });

    // Raw inserts so each document's status and createdAt are exactly as set.
    await models.post.collection.insertMany([
      { _id: ids.pendingBlog, title: 'Pending blog', shortDesc: 's', description: 'one two three', status: PostStatus.PENDING, createdAt: at(10) },
      { _id: ids.deletedBlog, title: 'Deleted blog', shortDesc: 's', description: 'd', status: PostStatus.DELETED, createdAt: at(9) },
      { _id: ids.approvedBlog, title: 'Live blog', shortDesc: 's', description: 'd', status: PostStatus.APPROVED, createdAt: at(8) },
    ]);
    await models.event.collection.insertMany([
      { _id: ids.pendingEvent, title: 'Pending event', host: 'Host', status: EventStatus.PENDING, eventDate: nextMonth, createdAt: at(7) },
      { _id: ids.approvedEvent, title: 'Live event', host: 'Host', status: EventStatus.APPROVED, eventDate: nextMonth, createdAt: at(6) },
    ]);
    await models.user.collection.insertMany([
      { _id: ids.applicant, email: 'applicant@x.com', userHandle: 'applicant', applicationStatus: ApplicationStatus.PENDING, basicInfo: { firstName: 'App', lastName: 'Licant' }, createdAt: at(5) },
      { _id: ids.nomineeUser, email: 'ada@x.com', userHandle: 'ada', basicInfo: { firstName: 'Ada', lastName: 'Lovelace' }, createdAt: at(1) },
    ]);
    await models.candidate.collection.insertMany([
      { _id: ids.invitedCandidate, email: 'new@x.com', status: LeadCandidateStatus.INVITED, recommendedFor: 'Lead', sessionId: new Types.ObjectId(), recommendedBy: new Types.ObjectId(), recommendedAt: at(4), createdAt: at(4) },
      { _id: ids.acceptedCandidate, email: 'ada@x.com', userId: ids.nomineeUser, status: LeadCandidateStatus.PENDING, recommendedFor: 'Co-Lead', sessionId: new Types.ObjectId(), recommendedBy: new Types.ObjectId(), recommendedAt: at(3), createdAt: at(3) },
    ]);
    // The invitation sent with the INVITED nomination; it must not be counted again.
    await models.invitation.collection.insertOne({
      candidate: ids.invitedCandidate,
      status: 'pending',
      createdAt: at(4),
    });
  });

  afterAll(async () => {
    if (!app) return;
    for (const token of ['APP_CONNECTION', 'LOG_CONNECTION']) {
      const connection = app.get<Connection>(token);
      await connection.dropDatabase();
    }
    await app.close();
  });

  describe('routing', () => {
    it('serves every route under /api/v1 or /api/v2, with no doubled version segment', () => {
      const routes = listRoutes();
      expect(routes.length).toBeGreaterThan(20);
      for (const route of routes) {
        expect(route).toMatch(/^[A-Z]+ \/api\/v[12](\/|$)/);
        expect(route).not.toMatch(/\/v[12]\/v[12]\b/);
      }
    });

    it('exposes exactly the v2 endpoints under /api/v2', () => {
      const v2Routes = listRoutes()
        .filter((r) => r.includes('/api/v2'))
        .sort();
      expect(v2Routes).toEqual(
        [
          'GET /api/v2',
          'GET /api/v2/dashboard/stats',
          'GET /api/v2/approvals/pending',
          'POST /api/v2/approvals/:id/approve',
          'DELETE /api/v2/approvals/:id',
        ].sort(),
      );
    });

    it('keeps the existing v1 routes, including leads, data logs and the app index', () => {
      const routes = listRoutes();
      for (const expected of [
        'GET /api/v1',
        'GET /api/v1/users/:id',
        'GET /api/v1/admin/lead-candidates',
        'GET /api/v1/school-sessions',
        'GET /api/v1/lead-invitations/:token',
        'GET /api/v1/admin/lead-assignments',
        'GET /api/v1/leads/current',
        'GET /api/v1/admins/data-logs',
      ]) {
        expect(routes).toContain(expected);
      }
    });

    it('responds on the versioned URLs and 404s on the unversioned ones', async () => {
      await request(app.getHttpServer()).get('/api/v1').expect(200, 'Hello World!');
      await request(app.getHttpServer())
        .get('/api/v2')
        .expect(200)
        .expect((res) => expect(res.body.version).toBe('2.0.0'));
      await request(app.getHttpServer()).get('/api/v2/dashboard/stats').expect(401);
      await request(app.getHttpServer()).get('/api/dashboard/stats').expect(404);
      await request(app.getHttpServer()).get('/api/v1/v2/dashboard/stats').expect(404);
    });
  });

  describe('GET /api/v2/dashboard/stats', () => {
    it('counts invited and accepted nominations once each, plus direct applications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v2/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({
        leads: { total: 0, pending: 3 }, // 1 application + 2 nominations
        events: { upcoming: 1, pending: 1 },
        blogs: { published: 1, pending: 1 },
        deactivated: { total: 0 },
      });
    });
  });

  describe('GET /api/v2/approvals/pending', () => {
    const get = (query: string) =>
      request(app.getHttpServer())
        .get(`/api/v2/approvals/pending${query}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

    it('lists only pending items, newest first, with a total from the database', async () => {
      const res = await get('?limit=10');
      expect(res.body.total).toBe(5);
      expect(res.body.items.map((i: any) => i.id)).toEqual([
        ids.pendingBlog.toString(),
        ids.pendingEvent.toString(),
        ids.applicant.toString(),
        ids.invitedCandidate.toString(),
        ids.acceptedCandidate.toString(),
      ]);
    });

    it('pages across the merged sources', async () => {
      const page2 = await get('?page=2&limit=2');
      expect(page2.body).toMatchObject({ page: 2, limit: 2, total: 5 });
      expect(page2.body.items.map((i: any) => i.id)).toEqual([
        ids.applicant.toString(),
        ids.invitedCandidate.toString(),
      ]);

      const page3 = await get('?page=3&limit=2');
      expect(page3.body.items.map((i: any) => i.id)).toEqual([
        ids.acceptedCandidate.toString(),
      ]);
    });

    it('shows nominations by nominee name (or email) and recommended position', async () => {
      const res = await get('?type=lead');
      expect(res.body.total).toBe(3);
      expect(res.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: ids.invitedCandidate.toString(), title: 'new@x.com', role: 'Lead' }),
          expect.objectContaining({ id: ids.acceptedCandidate.toString(), title: 'Ada Lovelace', role: 'Co-Lead' }),
          expect.objectContaining({ id: ids.applicant.toString(), title: 'App Licant' }),
        ]),
      );
    });
  });

  describe('approve and reject', () => {
    const approve = (id: Types.ObjectId, token = adminToken) =>
      request(app.getHttpServer())
        .post(`/api/v2/approvals/${id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
    const reject = (id: Types.ObjectId) =>
      request(app.getHttpServer())
        .delete(`/api/v2/approvals/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
    const statusOf = async (model: Model<any>, id: Types.ObjectId) =>
      (await model.collection.findOne({ _id: id }))?.status;

    it('refuses to republish a soft-deleted blog', async () => {
      await approve(ids.deletedBlog).expect(400);
      expect(await statusOf(models.post, ids.deletedBlog)).toBe(PostStatus.DELETED);
    });

    it('refuses to remove a live (approved) event', async () => {
      await reject(ids.approvedEvent).expect(400);
      expect(await statusOf(models.event, ids.approvedEvent)).toBe(EventStatus.APPROVED);
    });

    it('rejects a token without an admin id with 401', async () => {
      const tokenWithoutId = global.jwtService.sign({ role: [UserRole.ADMIN] });
      await approve(ids.pendingBlog, tokenWithoutId).expect(401);
      expect(await statusOf(models.post, ids.pendingBlog)).toBe(PostStatus.PENDING);
    });

    it('approves a pending blog once', async () => {
      await approve(ids.pendingBlog).expect(201);
      expect(await statusOf(models.post, ids.pendingBlog)).toBe(PostStatus.APPROVED);
      await approve(ids.pendingBlog).expect(400);
    });

    it('removes a pending event', async () => {
      await reject(ids.pendingEvent).expect(200);
      expect(await statusOf(models.event, ids.pendingEvent)).toBe(EventStatus.DELETED);
    });

    it('returns 404 for an unknown id', async () => {
      await approve(new Types.ObjectId()).expect(404);
    });
  });
});
