import { LeadsService } from "./leads.service";

test.skip("LeadsService.inviteLead", async () => {
  let schoolSessionService!: ConstructorParameters<typeof LeadsService>[0];
  let userService!: ConstructorParameters<typeof LeadsService>[1];
  let configService!: ConstructorParameters<typeof LeadsService>[2];
  let candidateService!: ConstructorParameters<typeof LeadsService>[3];
  let leadAuditService!: ConstructorParameters<typeof LeadsService>[4];
  let leadInvitationService!: ConstructorParameters<typeof LeadsService>[5];
  let data!: Parameters<LeadsService["inviteLead"]>[0];
  let adminId!: Parameters<LeadsService["inviteLead"]>[1];
  const instance = new LeadsService(schoolSessionService, userService, configService, candidateService, leadAuditService, leadInvitationService);
  const result = await instance.inviteLead(data, adminId);
  expect(result).toBe(/* expected */);
});
