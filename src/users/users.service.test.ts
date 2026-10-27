import { UsersService } from "./users.service";

test.skip("UsersService.sendEmailVerificationToken", () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let req!: Parameters<UsersService["sendEmailVerificationToken"]>[0];
  let userId!: Parameters<UsersService["sendEmailVerificationToken"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = instance.sendEmailVerificationToken(req, userId);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.findAll", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let req!: Parameters<UsersService["findAll"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.findAll(req);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.findById", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let id!: Parameters<UsersService["findById"]>[0];
  let project!: Parameters<UsersService["findById"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.findById(id, project);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.findByEmail", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["findByEmail"]>[0];
  let project!: Parameters<UsersService["findByEmail"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.findByEmail(email, project);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.findByEmailWithId", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["findByEmailWithId"]>[0];
  let project!: Parameters<UsersService["findByEmailWithId"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.findByEmailWithId(email, project);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.checkUserExists", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["checkUserExists"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.checkUserExists(email);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.update", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let userId!: Parameters<UsersService["update"]>[0];
  let payload!: Parameters<UsersService["update"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.update(userId, payload);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.createTempRegistration", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["createTempRegistration"]>[0];
  let leadPosition!: Parameters<UsersService["createTempRegistration"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.createTempRegistration(email, leadPosition);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.addPhoto", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let userId!: Parameters<UsersService["addPhoto"]>[0];
  let payload!: Parameters<UsersService["addPhoto"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.addPhoto(userId, payload);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.remove", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let id!: Parameters<UsersService["remove"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.remove(id);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.findMe", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let req!: Parameters<UsersService["findMe"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.findMe(req);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.changePassword", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let req!: Parameters<UsersService["changePassword"]>[0];
  let userId!: Parameters<UsersService["changePassword"]>[1];
  let payload!: Parameters<UsersService["changePassword"]>[2];
  let isAdmin!: Parameters<UsersService["changePassword"]>[3];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.changePassword(req, userId, payload, isAdmin);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.forgetPassword", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["forgetPassword"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.forgetPassword(email);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.updateStatus", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let userId!: Parameters<UsersService["updateStatus"]>[0];
  let status!: Parameters<UsersService["updateStatus"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.updateStatus(userId, status);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.deactivateAccount", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let userId!: Parameters<UsersService["deactivateAccount"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.deactivateAccount(userId);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.requestReactivation", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let userId!: Parameters<UsersService["requestReactivation"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.requestReactivation(userId);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.viewOneApplication", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["viewOneApplication"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.viewOneApplication(email);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.viewApplications", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.viewApplications();
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.approveTempApplication", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["approveTempApplication"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.approveTempApplication(email);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.inviteLead", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["inviteLead"]>[0];
  let metadata!: Parameters<UsersService["inviteLead"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.inviteLead(email, metadata);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.rejectTempApplication", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["rejectTempApplication"]>[0];
  let message!: Parameters<UsersService["rejectTempApplication"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.rejectTempApplication(email, message);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.completeProfile", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let data!: Parameters<UsersService["completeProfile"]>[0];
  let token!: Parameters<UsersService["completeProfile"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.completeProfile(data, token);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.generateRandomToken", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let email!: Parameters<UsersService["generateRandomToken"]>[0];
  let length!: Parameters<UsersService["generateRandomToken"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.generateRandomToken(email, length);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.createUser", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let req!: Parameters<UsersService["createUser"]>[0];
  let userData!: Parameters<UsersService["createUser"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.createUser(req, userData);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.paraseEncryptedParams", () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let encryptedParams!: Parameters<UsersService["paraseEncryptedParams"]>[0];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = instance.paraseEncryptedParams(encryptedParams);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.getUsersWithLeadRole", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.getUsersWithLeadRole();
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.requestVerification", async () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  let req!: Parameters<UsersService["requestVerification"]>[0];
  let userId!: Parameters<UsersService["requestVerification"]>[1];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = await instance.requestVerification(req, userId);
  expect(result).toBe(/* expected */);
});

test.skip("UsersService.pingMail", () => {
  let userModel!: ConstructorParameters<typeof UsersService>[0];
  let inviteTokenModel!: ConstructorParameters<typeof UsersService>[1];
  let configService!: ConstructorParameters<typeof UsersService>[2];
  const instance = new UsersService(userModel, inviteTokenModel, configService);
  const result = instance.pingMail();
  expect(result).toBe(/* expected */);
});
