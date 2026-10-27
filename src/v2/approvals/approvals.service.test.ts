import { ApprovalsService } from "./approvals.service";

test.skip("ApprovalsService.getPendingApprovals", async () => {
  let postModel!: ConstructorParameters<typeof ApprovalsService>[0];
  let eventModel!: ConstructorParameters<typeof ApprovalsService>[1];
  let userModel!: ConstructorParameters<typeof ApprovalsService>[2];
  let leadCandidateModel!: ConstructorParameters<typeof ApprovalsService>[3];
  let postService!: ConstructorParameters<typeof ApprovalsService>[4];
  let eventService!: ConstructorParameters<typeof ApprovalsService>[5];
  let usersService!: ConstructorParameters<typeof ApprovalsService>[6];
  let candidateService!: ConstructorParameters<typeof ApprovalsService>[7];
  let query!: Parameters<ApprovalsService["getPendingApprovals"]>[0];
  const instance = new ApprovalsService(postModel, eventModel, userModel, leadCandidateModel, postService, eventService, usersService, candidateService);
  const result = await instance.getPendingApprovals(query);
  expect(result).toBe(/* expected */);
});

test.skip("ApprovalsService.approveItem", async () => {
  let postModel!: ConstructorParameters<typeof ApprovalsService>[0];
  let eventModel!: ConstructorParameters<typeof ApprovalsService>[1];
  let userModel!: ConstructorParameters<typeof ApprovalsService>[2];
  let leadCandidateModel!: ConstructorParameters<typeof ApprovalsService>[3];
  let postService!: ConstructorParameters<typeof ApprovalsService>[4];
  let eventService!: ConstructorParameters<typeof ApprovalsService>[5];
  let usersService!: ConstructorParameters<typeof ApprovalsService>[6];
  let candidateService!: ConstructorParameters<typeof ApprovalsService>[7];
  let id!: Parameters<ApprovalsService["approveItem"]>[0];
  let adminId!: Parameters<ApprovalsService["approveItem"]>[1];
  let dto!: Parameters<ApprovalsService["approveItem"]>[2];
  const instance = new ApprovalsService(postModel, eventModel, userModel, leadCandidateModel, postService, eventService, usersService, candidateService);
  const result = await instance.approveItem(id, adminId, dto);
  expect(result).toBe(/* expected */);
});

test.skip("ApprovalsService.rejectItem", async () => {
  let postModel!: ConstructorParameters<typeof ApprovalsService>[0];
  let eventModel!: ConstructorParameters<typeof ApprovalsService>[1];
  let userModel!: ConstructorParameters<typeof ApprovalsService>[2];
  let leadCandidateModel!: ConstructorParameters<typeof ApprovalsService>[3];
  let postService!: ConstructorParameters<typeof ApprovalsService>[4];
  let eventService!: ConstructorParameters<typeof ApprovalsService>[5];
  let usersService!: ConstructorParameters<typeof ApprovalsService>[6];
  let candidateService!: ConstructorParameters<typeof ApprovalsService>[7];
  let id!: Parameters<ApprovalsService["rejectItem"]>[0];
  let adminId!: Parameters<ApprovalsService["rejectItem"]>[1];
  let req!: Parameters<ApprovalsService["rejectItem"]>[2];
  let dto!: Parameters<ApprovalsService["rejectItem"]>[3];
  const instance = new ApprovalsService(postModel, eventModel, userModel, leadCandidateModel, postService, eventService, usersService, candidateService);
  const result = await instance.rejectItem(id, adminId, req, dto);
  expect(result).toBe(/* expected */);
});
