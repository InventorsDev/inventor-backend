import { ApiProperty } from '@nestjs/swagger';

export class TeamMemberSocialsDto {
  @ApiProperty({ required: false }) portfolio?: string;
  @ApiProperty({ required: false }) twitter?: string;
  @ApiProperty({ required: false }) linkedIn?: string;
  @ApiProperty({ required: false }) facebook?: string;
}

export class TeamMemberDto {
  @ApiProperty() fullName: string;
  @ApiProperty({ required: false }) profilePic?: string;
  @ApiProperty({ required: false }) bio?: string;
  @ApiProperty({ required: false }) company?: string;
  @ApiProperty({ required: false }) role?: string;
  @ApiProperty({ required: false }) experience?: number;
  @ApiProperty({ required: false }) primarySkill?: string;
  @ApiProperty({ required: false }) secondarySkill?: string;
  @ApiProperty({ type: [String] }) technologies: string[];
  @ApiProperty() email: string;
  @ApiProperty({ required: false }) phone?: string;
  @ApiProperty({ type: TeamMemberSocialsDto }) socials: TeamMemberSocialsDto;
  @ApiProperty({ required: false }) location?: string;
  @ApiProperty({ type: [String] }) areasOfInterest: string[];
}
