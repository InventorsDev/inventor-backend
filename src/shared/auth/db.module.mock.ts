// db.module.mock.ts
import { Module } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../schema'; // Adjust the path as necessary
import { mockUserModel } from './auth.controller.spec';

@Module({
  providers: [
    {
      provide: getModelToken(User.name),
      useValue: mockUserModel, // Use your mocked user model here
    },
  ],
  exports: [getModelToken(User.name)], // Export the mocked model if needed
})
export class MockDBModule {}
