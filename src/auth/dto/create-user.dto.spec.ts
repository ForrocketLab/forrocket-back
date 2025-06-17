import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUserDto, ProjectAssignmentDto, UserType } from './create-user.dto';

describe('CreateUserDto', () => {
  const validProjectMemberData = {
    userType: UserType.PROJECT_MEMBER,
    name: 'João Silva Santos',
    email: 'joao.santos@rocketcorp.com',
    password: 'MinhaSenh@123',
    jobTitle: 'Desenvolvedor Backend',
    seniority: 'Júnior',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',
    projectAssignments: [
      {
        projectId: 'api-core',
        roleInProject: 'colaborador'
      }
    ],
    mentorId: 'mentor-123'
  };

  const validAdminData = {
    userType: UserType.ADMIN,
    name: 'Admin Sistema',
    email: 'admin.sistema@rocketcorp.com',
    password: 'AdminSenh@123',
    jobTitle: 'DevOps Engineer',
    seniority: 'Sênior',
    careerTrack: 'Tech',
    businessUnit: 'Operations'
  };

  describe('Validações básicas', () => {
    it('deve validar com dados corretos para project_member', async () => {
      // Arrange
      const dto = plainToClass(CreateUserDto, validProjectMemberData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('deve validar com dados corretos para admin', async () => {
      // Arrange
      const dto = plainToClass(CreateUserDto, validAdminData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('deve rejeitar name vazio', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, name: '' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('deve rejeitar name não string', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, name: 123 };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('Validações de userType', () => {
    it('deve rejeitar userType inválido', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, userType: 'tipo_invalido' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userType');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toBe('userType deve ser um dos seguintes valores: admin, rh, comite, project_member');
    });

    it('deve aceitar todos os userTypes válidos', async () => {
      const validTypes = [UserType.ADMIN, UserType.RH, UserType.COMITE, UserType.PROJECT_MEMBER];

      for (const userType of validTypes) {
        // Arrange
        const validData = { ...validProjectMemberData, userType };
        const dto = plainToClass(CreateUserDto, validData);

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('Validações de email', () => {
    it('deve rejeitar email inválido', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, email: 'email-invalido' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('deve rejeitar email com domínio incorreto', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, email: 'user@gmail.com' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(errors[0].constraints?.matches).toBe('Email deve ter o domínio @rocketcorp.com');
    });

    it('deve aceitar email com domínio @rocketcorp.com', async () => {
      // Arrange
      const validData = { ...validProjectMemberData, email: 'teste@rocketcorp.com' };
      const dto = plainToClass(CreateUserDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validações de senha', () => {
    it('deve rejeitar senha com menos de 8 caracteres', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, password: '123' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
      expect(errors[0].constraints?.minLength).toBe('Senha deve ter pelo menos 8 caracteres');
    });

    it('deve aceitar senha com 8 ou mais caracteres', async () => {
      // Arrange
      const validData = { ...validProjectMemberData, password: 'MinhaSenh@123' };
      const dto = plainToClass(CreateUserDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validações de enums', () => {
    it('deve rejeitar jobTitle inválido', async () => {
      const invalidData = {
        ...validProjectMemberData,
        jobTitle: 'Cargo Inexistente'
      };

      const dto = plainToClass(CreateUserDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('jobTitle');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toBe('jobTitle deve ser um dos seguintes valores: Desenvolvedora Frontend, Desenvolvedor Backend, Product Designer, Product Manager, Tech Lead, DevOps Engineer, Data Analyst, QA Engineer, People & Culture Manager, Head of Engineering, System Administrator');
    });

    it('deve aceitar jobTitles válidos', async () => {
      const validTitles = [
        'Desenvolvedora Frontend',
        'Desenvolvedor Backend',
        'Product Designer',
        'Product Manager',
        'Tech Lead',
        'DevOps Engineer',
        'Data Analyst',
        'QA Engineer'
      ];

      for (const title of validTitles) {
        // Arrange
        const validData = { ...validProjectMemberData, jobTitle: title };
        const dto = plainToClass(CreateUserDto, validData);

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('deve rejeitar seniority inválido', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, seniority: 'Super Sênior' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('seniority');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toBe('seniority deve ser um dos seguintes valores: Júnior, Pleno, Sênior, Principal, Staff');
    });

    it('deve aceitar seniorities válidos', async () => {
      const validSeniorities = ['Júnior', 'Pleno', 'Sênior', 'Principal', 'Staff'];

      for (const seniority of validSeniorities) {
        // Arrange
        const validData = { ...validProjectMemberData, seniority };
        const dto = plainToClass(CreateUserDto, validData);

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('deve rejeitar careerTrack inválido', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, careerTrack: 'Marketing' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('careerTrack');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toBe('careerTrack deve ser um dos seguintes valores: Tech, Business');
    });

    it('deve aceitar careerTracks válidos', async () => {
      const validTracks = ['Tech', 'Business'];

      for (const track of validTracks) {
        // Arrange
        const validData = { ...validProjectMemberData, careerTrack: track };
        const dto = plainToClass(CreateUserDto, validData);

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('deve rejeitar businessUnit inválido', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, businessUnit: 'Marketing' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('businessUnit');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toBe('businessUnit deve ser um dos seguintes valores: Digital Products, Operations');
    });

    it('deve aceitar businessUnits válidos', async () => {
      const validUnits = ['Digital Products', 'Operations'];

      for (const unit of validUnits) {
        // Arrange
        const validData = { ...validProjectMemberData, businessUnit: unit };
        const dto = plainToClass(CreateUserDto, validData);

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('Validações de projectAssignments', () => {
    it('deve aceitar projectAssignments vazio para tipos globais', async () => {
      // Arrange
      const dto = {
        ...validAdminData,
        projectAssignments: []
      };

      // Act
      const errors = await validate(plainToClass(CreateUserDto, dto));

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('deve rejeitar projectAssignments não array', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, projectAssignments: 'não é array' };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectAssignments');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('deve validar ProjectAssignmentDto aninhado', async () => {
      // Arrange
      const invalidData = {
        ...validProjectMemberData,
        projectAssignments: [
          {
            projectId: '', // inválido
            roleInProject: 'role-inválida' // inválido
          }
        ]
      };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectAssignments');
      expect(errors[0].children).toBeDefined();
      expect(errors[0].children?.[0]?.children).toBeDefined();
    });
  });

  describe('Validações de mentorId (opcional)', () => {
    it('deve aceitar mentorId undefined', async () => {
      // Arrange
      const validData = { ...validProjectMemberData };
      const { mentorId, ...dataWithoutMentor } = validData;
      const dto = plainToClass(CreateUserDto, dataWithoutMentor);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('deve aceitar mentorId válido', async () => {
      // Arrange
      const validData = { ...validProjectMemberData, mentorId: 'mentor-123' };
      const dto = plainToClass(CreateUserDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('deve rejeitar mentorId não string', async () => {
      // Arrange
      const invalidData = { ...validProjectMemberData, mentorId: 123 };
      const dto = plainToClass(CreateUserDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mentorId');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});

describe('ProjectAssignmentDto', () => {
  const validProjectData = {
    projectId: 'api-core',
    roleInProject: 'colaborador'
  };

  describe('Validações de projectId', () => {
    it('deve validar com dados corretos', async () => {
      // Arrange
      const dto = plainToClass(ProjectAssignmentDto, validProjectData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('deve rejeitar projectId vazio', async () => {
      // Arrange
      const invalidData = { ...validProjectData, projectId: '' };
      const dto = plainToClass(ProjectAssignmentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('deve rejeitar projectId não string', async () => {
      // Arrange
      const invalidData = { ...validProjectData, projectId: 123 };
      const dto = plainToClass(ProjectAssignmentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectId');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('Validações de roleInProject', () => {
    it('deve aceitar roles válidos', async () => {
      const validRoles = ['colaborador', 'gestor'];

      for (const role of validRoles) {
        // Arrange
        const validData = { ...validProjectData, roleInProject: role };
        const dto = plainToClass(ProjectAssignmentDto, validData);

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('deve rejeitar role inválido', async () => {
      // Arrange
      const invalidData = { ...validProjectData, roleInProject: 'admin' };
      const dto = plainToClass(ProjectAssignmentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('roleInProject');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toBe('roleInProject deve ser um dos seguintes valores: colaborador, gestor');
    });
  });
}); 