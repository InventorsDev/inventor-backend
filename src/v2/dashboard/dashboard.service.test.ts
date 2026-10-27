import { DashboardService } from "./dashboard.service";

test.skip("DashboardService.getDashboardStats", async () => {
  let userModel!: ConstructorParameters<typeof DashboardService>[0];
  let eventModel!: ConstructorParameters<typeof DashboardService>[1];
  let postModel!: ConstructorParameters<typeof DashboardService>[2];
  let leadCandidateModel!: ConstructorParameters<typeof DashboardService>[3];
  let leadInvitationModel!: ConstructorParameters<typeof DashboardService>[4];
  const instance = new DashboardService(userModel, eventModel, postModel, leadCandidateModel, leadInvitationModel);
  const result = await instance.getDashboardStats();
  expect(result).toBe(/* expected */);
});
