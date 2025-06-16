export interface TeammateDto {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  seniority: string;
  roles: string[];
  isManager: boolean;
}

export interface ProjectTeammatesDto {
  projectName: string;
  teammates: TeammateDto[];
}

export interface EvaluableUserDto {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  seniority: string;
  roles: string[];
}

export interface EvaluableUsersResponseDto {
  colleagues: EvaluableUserDto[];
  managers: EvaluableUserDto[];
  mentors: EvaluableUserDto[];
}
