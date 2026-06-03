using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class PostgreSQLInitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssessmentTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ContactPerson = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Courses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LearningPathways",
                columns: table => new
                {
                    PathwayId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Synced = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningPathways", x => x.PathwayId);
                });

            migrationBuilder.CreateTable(
                name: "legacy_qualifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    qualification_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    level = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    credits = table.Column<int>(type: "integer", nullable: true),
                    qualification_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    has_cat = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_legacy_qualifications", x => x.id);
                    table.UniqueConstraint("AK_legacy_qualifications_qualification_id", x => x.qualification_id);
                });

            migrationBuilder.CreateTable(
                name: "occupational_qualifications",
                columns: table => new
                {
                    qualification_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    level = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    credits = table.Column<int>(type: "integer", nullable: false),
                    qualification_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    quality_partner = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    trade = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    has_cat = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_occupational_qualifications", x => x.qualification_id);
                });

            migrationBuilder.CreateTable(
                name: "QualificationTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualificationTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemAdmins",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AccessLevel = table.Column<int>(type: "integer", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LoginAttempts = table.Column<int>(type: "integer", nullable: false),
                    LockedUntil = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemAdmins", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SkillsDevelopmentProviders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AccreditationNumber = table.Column<string>(type: "text", nullable: true),
                    AccreditationExpiryDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ContactPerson = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ClientId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillsDevelopmentProviders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillsDevelopmentProviders_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Modules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CourseId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Modules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Modules_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "legacy_unit_standards",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    unitstandard_id = table.Column<int>(type: "integer", nullable: true),
                    qualification_id = table.Column<int>(type: "integer", nullable: true),
                    unit_standard_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    level = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    credits = table.Column<int>(type: "integer", nullable: true),
                    synced = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_legacy_unit_standards", x => x.id);
                    table.ForeignKey(
                        name: "FK_legacy_unit_standards_legacy_qualifications_qualification_id",
                        column: x => x.qualification_id,
                        principalTable: "legacy_qualifications",
                        principalColumn: "qualification_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "occupational_unit_standards",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    qualification_id = table.Column<int>(type: "integer", nullable: true),
                    module_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    unit_standard_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    module_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    level = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    credits = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_occupational_unit_standards", x => x.id);
                    table.ForeignKey(
                        name: "FK_occupational_unit_standards_occupational_qualifications_qua~",
                        column: x => x.qualification_id,
                        principalTable: "occupational_qualifications",
                        principalColumn: "qualification_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ManagerFirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ManagerSurname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ManagerEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    SkillsDevelopmentProviderId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_SkillsDevelopmentProviders_SkillsDevelopmentPro~",
                        column: x => x.SkillsDevelopmentProviderId,
                        principalTable: "SkillsDevelopmentProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContractNumber = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FinancialYear = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    NumberOfBeneficiaries = table.Column<int>(type: "integer", nullable: false),
                    HasPPE = table.Column<bool>(type: "boolean", nullable: false),
                    HasLearningMaterial = table.Column<bool>(type: "boolean", nullable: false),
                    HasToolkit = table.Column<bool>(type: "boolean", nullable: false),
                    HasConsumables = table.Column<bool>(type: "boolean", nullable: false),
                    Province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProjectFunder = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    LeadEmployerPartner = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SkillsDevelopmentProviderId = table.Column<int>(type: "integer", nullable: false),
                    BudgetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Projects_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Projects_SkillsDevelopmentProviders_SkillsDevelopmentProvid~",
                        column: x => x.SkillsDevelopmentProviderId,
                        principalTable: "SkillsDevelopmentProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Lessons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModuleId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lessons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lessons_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AddressLine1 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AddressLine2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ProfileImage = table.Column<string>(type: "text", nullable: true),
                    Signature = table.Column<string>(type: "text", nullable: true),
                    Initials = table.Column<string>(type: "text", nullable: true),
                    PracticeNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ClientId = table.Column<int>(type: "integer", nullable: true),
                    SkillsDevelopmentProviderId = table.Column<int>(type: "integer", nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Users_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Users_SkillsDevelopmentProviders_SkillsDevelopmentProviderId",
                        column: x => x.SkillsDevelopmentProviderId,
                        principalTable: "SkillsDevelopmentProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProjectLearningPathways",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    PathwayId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectLearningPathways", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectLearningPathways_LearningPathways_PathwayId",
                        column: x => x.PathwayId,
                        principalTable: "LearningPathways",
                        principalColumn: "PathwayId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectLearningPathways_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    FileHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    IsEncrypted = table.Column<bool>(type: "boolean", nullable: false),
                    EncryptionAlgorithm = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EncryptionKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AccessLevel = table.Column<int>(type: "integer", nullable: false),
                    RequiresApproval = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    LastAccessedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ApprovedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    ParentDocumentId = table.Column<int>(type: "integer", nullable: true),
                    ClientId = table.Column<int>(type: "integer", nullable: true),
                    SkillsDevelopmentProviderId = table.Column<int>(type: "integer", nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Documents_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Documents_Documents_ParentDocumentId",
                        column: x => x.ParentDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Documents_SkillsDevelopmentProviders_SkillsDevelopmentProvi~",
                        column: x => x.SkillsDevelopmentProviderId,
                        principalTable: "SkillsDevelopmentProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Documents_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Documents_Users_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Documents_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Learners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IdNumber = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    ContactNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Gender = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Race = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HomeLanguage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Disability = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AddressLine1 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AddressLine2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AddressLine3 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    HighSchoolName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    YearOfCompletion = table.Column<int>(type: "integer", nullable: true),
                    SchoolLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    HighestGradePassed = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NextOfKinName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    NextOfKinRelation = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NextOfKinContactNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AccountType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BranchCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ProfilePhotoPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LeftThumbTemplate = table.Column<string>(type: "text", nullable: true),
                    RightThumbTemplate = table.Column<string>(type: "text", nullable: true),
                    FaceEmbedding = table.Column<string>(type: "text", nullable: true),
                    SignaturePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Learners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Learners_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProjectAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectAssignments_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectAssignments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectPhases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PlannedBeneficiaries = table.Column<int>(type: "integer", nullable: false),
                    ActualBeneficiaries = table.Column<int>(type: "integer", nullable: false),
                    BudgetAllocation = table.Column<decimal>(type: "numeric", nullable: false),
                    ActualSpent = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectPhases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectPhases_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectPhases_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectSites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    SiteName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SiteCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    Province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ContactFirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContactLastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContactCellNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Latitude = table.Column<decimal>(type: "numeric(10,8)", nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectSites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectSites_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectSites_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DueDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    AssignedToUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CompletionNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tasks_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tasks_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tasks_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectQualifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectLearningPathwayId = table.Column<int>(type: "integer", nullable: false),
                    QualificationTypeId = table.Column<int>(type: "integer", nullable: false),
                    OccupationalQualificationId = table.Column<int>(type: "integer", nullable: true),
                    LegacyQualificationId = table.Column<int>(type: "integer", nullable: true),
                    EmploymentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NumberOfBeneficiaries = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectQualifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectQualifications_ProjectLearningPathways_ProjectLearni~",
                        column: x => x.ProjectLearningPathwayId,
                        principalTable: "ProjectLearningPathways",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectQualifications_QualificationTypes_QualificationTypeId",
                        column: x => x.QualificationTypeId,
                        principalTable: "QualificationTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProjectQualifications_legacy_qualifications_LegacyQualifica~",
                        column: x => x.LegacyQualificationId,
                        principalTable: "legacy_qualifications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProjectQualifications_occupational_qualifications_Occupatio~",
                        column: x => x.OccupationalQualificationId,
                        principalTable: "occupational_qualifications",
                        principalColumn: "qualification_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DocumentAccessLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DocumentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Action = table.Column<int>(type: "integer", nullable: false),
                    AccessedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentAccessLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentAccessLogs_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentAccessLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DocumentAuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DocumentId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    AdditionalData = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsSecurityEvent = table.Column<bool>(type: "boolean", nullable: false),
                    SecurityEventType = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentAuditLogs_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentAuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DocumentPermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DocumentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CanView = table.Column<bool>(type: "boolean", nullable: false),
                    CanDownload = table.Column<bool>(type: "boolean", nullable: false),
                    CanEdit = table.Column<bool>(type: "boolean", nullable: false),
                    CanDelete = table.Column<bool>(type: "boolean", nullable: false),
                    CanShare = table.Column<bool>(type: "boolean", nullable: false),
                    CanApprove = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageAccess = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    GrantedByUserId = table.Column<int>(type: "integer", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RevokedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentPermissions_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentPermissions_Users_GrantedByUserId",
                        column: x => x.GrantedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DocumentPermissions_Users_RevokedByUserId",
                        column: x => x.RevokedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DocumentPermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearnerAssessmentAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearnerId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsRemedial = table.Column<bool>(type: "boolean", nullable: false),
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    ScannedDocumentPath = table.Column<string>(type: "text", nullable: false),
                    ScannedDocumentName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ScannedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Mark = table.Column<decimal>(type: "numeric", nullable: true),
                    AssessorComments = table.Column<string>(type: "text", nullable: true),
                    AssessorId = table.Column<int>(type: "integer", nullable: true),
                    MarkedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    MarkStatus = table.Column<int>(type: "integer", nullable: false),
                    ModeratedMark = table.Column<decimal>(type: "numeric", nullable: true),
                    ModeratorComments = table.Column<string>(type: "text", nullable: true),
                    ModeratorId = table.Column<int>(type: "integer", nullable: true),
                    ModeratedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModerationStatus = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearnerAssessmentAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearnerAssessmentAnswers_Learners_LearnerId",
                        column: x => x.LearnerId,
                        principalTable: "Learners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearnerAssessmentAnswers_Users_AssessorId",
                        column: x => x.AssessorId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LearnerAssessmentAnswers_Users_ModeratorId",
                        column: x => x.ModeratorId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LearnerDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearnerId = table.Column<int>(type: "integer", nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    EncryptedFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EncryptionIV = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FileHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ApprovedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DeclineReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearnerDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearnerDocuments_Learners_LearnerId",
                        column: x => x.LearnerId,
                        principalTable: "Learners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearnerDocuments_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LearnerDocuments_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SickNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearnerId = table.Column<int>(type: "integer", nullable: false),
                    MedicalFacility = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PractitionerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IssuedDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EncryptedFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    EncryptionIV = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ApprovedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SickNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SickNotes_Learners_LearnerId",
                        column: x => x.LearnerId,
                        principalTable: "Learners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SickNotes_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PhaseActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectPhaseId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ActivityCode = table.Column<string>(type: "text", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssignedToUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhaseActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhaseActivities_ProjectPhases_ProjectPhaseId",
                        column: x => x.ProjectPhaseId,
                        principalTable: "ProjectPhases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhaseActivities_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProjectPhaseLearningPathways",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectPhaseId = table.Column<int>(type: "integer", nullable: false),
                    ProjectLearningPathwayId = table.Column<int>(type: "integer", nullable: false),
                    PlannedLearners = table.Column<int>(type: "integer", nullable: false),
                    ActualLearners = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectPhaseLearningPathways", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectPhaseLearningPathways_ProjectLearningPathways_Projec~",
                        column: x => x.ProjectLearningPathwayId,
                        principalTable: "ProjectLearningPathways",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectPhaseLearningPathways_ProjectPhases_ProjectPhaseId",
                        column: x => x.ProjectPhaseId,
                        principalTable: "ProjectPhases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SiteClasses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectSiteId = table.Column<int>(type: "integer", nullable: false),
                    ClassName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MaxLearners = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteClasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteClasses_ProjectSites_ProjectSiteId",
                        column: x => x.ProjectSiteId,
                        principalTable: "ProjectSites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SiteClasses_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TaskReminders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskId = table.Column<int>(type: "integer", nullable: false),
                    ReminderDateTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsSent = table.Column<bool>(type: "boolean", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskReminders_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectPhaseQualifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectPhaseId = table.Column<int>(type: "integer", nullable: false),
                    ProjectQualificationId = table.Column<int>(type: "integer", nullable: false),
                    PlannedLearners = table.Column<int>(type: "integer", nullable: false),
                    ActualLearners = table.Column<int>(type: "integer", nullable: false),
                    CompletedLearners = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectPhaseQualifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectPhaseQualifications_ProjectPhases_ProjectPhaseId",
                        column: x => x.ProjectPhaseId,
                        principalTable: "ProjectPhases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectPhaseQualifications_ProjectQualifications_ProjectQua~",
                        column: x => x.ProjectQualificationId,
                        principalTable: "ProjectQualifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectQualificationUnitStandards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectQualificationId = table.Column<int>(type: "integer", nullable: false),
                    UnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    UnitStandardType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectQualificationUnitStandards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectQualificationUnitStandards_ProjectQualifications_Pro~",
                        column: x => x.ProjectQualificationId,
                        principalTable: "ProjectQualifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhaseSubActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PhaseActivityId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ActivityCode = table.Column<string>(type: "text", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssignedToUserId = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhaseSubActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhaseSubActivities_PhaseActivities_PhaseActivityId",
                        column: x => x.PhaseActivityId,
                        principalTable: "PhaseActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhaseSubActivities_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ClassEnrollments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearnerId = table.Column<int>(type: "integer", nullable: false),
                    SiteClassId = table.Column<int>(type: "integer", nullable: false),
                    EnrollmentDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    WithdrawalDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    WithdrawalReason = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassEnrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassEnrollments_Learners_LearnerId",
                        column: x => x.LearnerId,
                        principalTable: "Learners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassEnrollments_SiteClasses_SiteClassId",
                        column: x => x.SiteClassId,
                        principalTable: "SiteClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassEnrollments_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ClassTeachers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClassId = table.Column<int>(type: "integer", nullable: false),
                    TeacherId = table.Column<int>(type: "integer", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassTeachers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassTeachers_SiteClasses_ClassId",
                        column: x => x.ClassId,
                        principalTable: "SiteClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassTeachers_Users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearnerAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearnerId = table.Column<int>(type: "integer", nullable: false),
                    ClassId = table.Column<int>(type: "integer", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ClockInTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ClockOutTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ClockInMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ClockOutMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ClockInVerified = table.Column<bool>(type: "boolean", nullable: false),
                    ClockOutVerified = table.Column<bool>(type: "boolean", nullable: false),
                    ClockInTeacherId = table.Column<int>(type: "integer", nullable: true),
                    ClockOutTeacherId = table.Column<int>(type: "integer", nullable: true),
                    ClockInLatitude = table.Column<decimal>(type: "numeric", nullable: true),
                    ClockInLongitude = table.Column<decimal>(type: "numeric", nullable: true),
                    ClockOutLatitude = table.Column<decimal>(type: "numeric", nullable: true),
                    ClockOutLongitude = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearnerAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearnerAttendances_Learners_LearnerId",
                        column: x => x.LearnerId,
                        principalTable: "Learners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearnerAttendances_SiteClasses_ClassId",
                        column: x => x.ClassId,
                        principalTable: "SiteClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearnerAttendances_Users_ClockInTeacherId",
                        column: x => x.ClockInTeacherId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LearnerAttendances_Users_ClockOutTeacherId",
                        column: x => x.ClockOutTeacherId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AssessmentStrategyPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectQualificationUnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    QuestionnaireTime = table.Column<string>(type: "text", nullable: true),
                    QuestionnairePeople = table.Column<string>(type: "text", nullable: true),
                    QuestionnaireLocation = table.Column<string>(type: "text", nullable: true),
                    QuestionnaireEquipment = table.Column<string>(type: "text", nullable: true),
                    PracticalTime = table.Column<string>(type: "text", nullable: true),
                    PracticalPeople = table.Column<string>(type: "text", nullable: true),
                    PracticalLocation = table.Column<string>(type: "text", nullable: true),
                    PracticalEquipment = table.Column<string>(type: "text", nullable: true),
                    AssessorName = table.Column<string>(type: "text", nullable: true),
                    AssessorNumber = table.Column<string>(type: "text", nullable: true),
                    AssessorSignature = table.Column<string>(type: "text", nullable: true),
                    ModeratorName = table.Column<string>(type: "text", nullable: true),
                    ModeratorNumber = table.Column<string>(type: "text", nullable: true),
                    ModeratorSignature = table.Column<string>(type: "text", nullable: true),
                    ModeratorInitials = table.Column<string>(type: "text", nullable: true),
                    PrepDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    PrepTime = table.Column<string>(type: "text", nullable: true),
                    PrepVenue = table.Column<string>(type: "text", nullable: true),
                    PrepComments = table.Column<string>(type: "text", nullable: true),
                    PrepItemsJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentStrategyPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentStrategyPlans_ProjectQualificationUnitStandards_P~",
                        column: x => x.ProjectQualificationUnitStandardId,
                        principalTable: "ProjectQualificationUnitStandards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormativeAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectQualificationUnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    AssessmentMethod = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Score = table.Column<decimal>(type: "numeric", nullable: true),
                    MaxScore = table.Column<decimal>(type: "numeric", nullable: true),
                    AssessorName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormativeAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormativeAssessments_ProjectQualificationUnitStandards_Proj~",
                        column: x => x.ProjectQualificationUnitStandardId,
                        principalTable: "ProjectQualificationUnitStandards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearnerAssessmentProgress",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearnerId = table.Column<int>(type: "integer", nullable: false),
                    ProjectQualificationUnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    FormativeAssessmentId = table.Column<int>(type: "integer", nullable: true),
                    SummativeAssessmentId = table.Column<int>(type: "integer", nullable: true),
                    FormativeCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    FormativeCompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    FormativeModerated = table.Column<bool>(type: "boolean", nullable: false),
                    FormativeModeratedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    SummativeCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    SummativeCompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    SummativeModerated = table.Column<bool>(type: "boolean", nullable: false),
                    SummativeModeratedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RemedialRequired = table.Column<bool>(type: "boolean", nullable: false),
                    RemedialCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    RemedialCompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearnerAssessmentProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearnerAssessmentProgress_Learners_LearnerId",
                        column: x => x.LearnerId,
                        principalTable: "Learners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearnerAssessmentProgress_ProjectQualificationUnitStandards~",
                        column: x => x.ProjectQualificationUnitStandardId,
                        principalTable: "ProjectQualificationUnitStandards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LogbookEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectQualificationUnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    EntryDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ActivityDescription = table.Column<string>(type: "text", nullable: false),
                    HoursSpent = table.Column<decimal>(type: "numeric", nullable: true),
                    SupervisorName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SupervisorSignature = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Approved = table.Column<bool>(type: "boolean", nullable: false),
                    ApprovedDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    EvidenceUrl = table.Column<string>(type: "text", nullable: true),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogbookEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogbookEntries_ProjectQualificationUnitStandards_ProjectQua~",
                        column: x => x.ProjectQualificationUnitStandardId,
                        principalTable: "ProjectQualificationUnitStandards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SummativeAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectQualificationUnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FinalScore = table.Column<decimal>(type: "numeric", nullable: true),
                    MaxScore = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AssessorName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ModeratorName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    ModeratorComments = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SummativeAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SummativeAssessments_ProjectQualificationUnitStandards_Proj~",
                        column: x => x.ProjectQualificationUnitStandardId,
                        principalTable: "ProjectQualificationUnitStandards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnitStandardAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectQualificationUnitStandardId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentTypeId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    TotalMarks = table.Column<int>(type: "integer", nullable: false),
                    PassingMarks = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitStandardAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitStandardAssessments_AssessmentTypes_AssessmentTypeId",
                        column: x => x.AssessmentTypeId,
                        principalTable: "AssessmentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UnitStandardAssessments_ProjectQualificationUnitStandards_P~",
                        column: x => x.ProjectQualificationUnitStandardId,
                        principalTable: "ProjectQualificationUnitStandards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UnitStandardAssessments_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AttendanceLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AttendanceId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActionTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ActionBy = table.Column<int>(type: "integer", nullable: false),
                    FingerprintMatched = table.Column<bool>(type: "boolean", nullable: true),
                    MatchScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    DeviceInfo = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceLogs_LearnerAttendances_AttendanceId",
                        column: x => x.AttendanceId,
                        principalTable: "LearnerAttendances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceLogs_Users_ActionBy",
                        column: x => x.ActionBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormativeAssessmentQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FormativeAssessmentId = table.Column<int>(type: "integer", nullable: false),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    AllocatedMarks = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormativeAssessmentQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormativeAssessmentQuestions_FormativeAssessments_Formative~",
                        column: x => x.FormativeAssessmentId,
                        principalTable: "FormativeAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SummativeAssessmentQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SummativeAssessmentId = table.Column<int>(type: "integer", nullable: false),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    AllocatedMarks = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SummativeAssessmentQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SummativeAssessmentQuestions_SummativeAssessments_Summative~",
                        column: x => x.SummativeAssessmentId,
                        principalTable: "SummativeAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UnitStandardAssessmentId = table.Column<int>(type: "integer", nullable: true),
                    FormativeAssessmentId = table.Column<int>(type: "integer", nullable: true),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    AllocatedMarks = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentQuestions_UnitStandardAssessments_UnitStandardAss~",
                        column: x => x.UnitStandardAssessmentId,
                        principalTable: "UnitStandardAssessments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentQuestions_UnitStandardAssessmentId",
                table: "AssessmentQuestions",
                column: "UnitStandardAssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentStrategyPlans_ProjectQualificationUnitStandardId",
                table: "AssessmentStrategyPlans",
                column: "ProjectQualificationUnitStandardId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceLogs_ActionBy",
                table: "AttendanceLogs",
                column: "ActionBy");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceLogs_AttendanceId",
                table: "AttendanceLogs",
                column: "AttendanceId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassEnrollments_CreatedByUserId",
                table: "ClassEnrollments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassEnrollments_LearnerId",
                table: "ClassEnrollments",
                column: "LearnerId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassEnrollments_SiteClassId",
                table: "ClassEnrollments",
                column: "SiteClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassTeachers_ClassId",
                table: "ClassTeachers",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassTeachers_TeacherId",
                table: "ClassTeachers",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_CreatedAt",
                table: "Clients",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_Email",
                table: "Clients",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_Name",
                table: "Clients",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_Status",
                table: "Clients",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_CreatedAt",
                table: "Courses",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_Title",
                table: "Courses",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_CreatedAt",
                table: "Departments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Name",
                table: "Departments",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_SkillsDevelopmentProviderId",
                table: "Departments",
                column: "SkillsDevelopmentProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Status",
                table: "Departments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Type",
                table: "Departments",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAccessLogs_AccessedAt",
                table: "DocumentAccessLogs",
                column: "AccessedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAccessLogs_Action",
                table: "DocumentAccessLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAccessLogs_DocumentId",
                table: "DocumentAccessLogs",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAccessLogs_UserId",
                table: "DocumentAccessLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAuditLogs_Action",
                table: "DocumentAuditLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAuditLogs_DocumentId",
                table: "DocumentAuditLogs",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAuditLogs_IsSecurityEvent",
                table: "DocumentAuditLogs",
                column: "IsSecurityEvent");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAuditLogs_SecurityEventType",
                table: "DocumentAuditLogs",
                column: "SecurityEventType");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAuditLogs_Timestamp",
                table: "DocumentAuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAuditLogs_UserId",
                table: "DocumentAuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_DocumentId",
                table: "DocumentPermissions",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_ExpiresAt",
                table: "DocumentPermissions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_GrantedAt",
                table: "DocumentPermissions",
                column: "GrantedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_GrantedByUserId",
                table: "DocumentPermissions",
                column: "GrantedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_IsActive",
                table: "DocumentPermissions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_RevokedByUserId",
                table: "DocumentPermissions",
                column: "RevokedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPermissions_UserId",
                table: "DocumentPermissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_AccessLevel",
                table: "Documents",
                column: "AccessLevel");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ApprovedByUserId",
                table: "Documents",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ClientId",
                table: "Documents",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CreatedAt",
                table: "Documents",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DeletedByUserId",
                table: "Documents",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DepartmentId",
                table: "Documents",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ExpiresAt",
                table: "Documents",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_Name",
                table: "Documents",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ParentDocumentId",
                table: "Documents",
                column: "ParentDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_SkillsDevelopmentProviderId",
                table: "Documents",
                column: "SkillsDevelopmentProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_Status",
                table: "Documents",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_Type",
                table: "Documents",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_UploadedByUserId",
                table: "Documents",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormativeAssessmentQuestions_FormativeAssessmentId",
                table: "FormativeAssessmentQuestions",
                column: "FormativeAssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_FormativeAssessments_ProjectQualificationUnitStandardId",
                table: "FormativeAssessments",
                column: "ProjectQualificationUnitStandardId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAssessmentAnswers_AssessorId",
                table: "LearnerAssessmentAnswers",
                column: "AssessorId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAssessmentAnswers_LearnerId",
                table: "LearnerAssessmentAnswers",
                column: "LearnerId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAssessmentAnswers_ModeratorId",
                table: "LearnerAssessmentAnswers",
                column: "ModeratorId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAssessmentProgress_LearnerId",
                table: "LearnerAssessmentProgress",
                column: "LearnerId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAssessmentProgress_ProjectQualificationUnitStandardId",
                table: "LearnerAssessmentProgress",
                column: "ProjectQualificationUnitStandardId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAttendances_ClassId",
                table: "LearnerAttendances",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAttendances_ClockInTeacherId",
                table: "LearnerAttendances",
                column: "ClockInTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAttendances_ClockOutTeacherId",
                table: "LearnerAttendances",
                column: "ClockOutTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerAttendances_LearnerId",
                table: "LearnerAttendances",
                column: "LearnerId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerDocuments_ApprovedByUserId",
                table: "LearnerDocuments",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerDocuments_LearnerId",
                table: "LearnerDocuments",
                column: "LearnerId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerDocuments_UploadedByUserId",
                table: "LearnerDocuments",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Learners_CreatedByUserId",
                table: "Learners",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_legacy_unit_standards_qualification_id",
                table: "legacy_unit_standards",
                column: "qualification_id");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_ModuleId",
                table: "Lessons",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_Order",
                table: "Lessons",
                column: "Order");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_Title",
                table: "Lessons",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_LogbookEntries_ProjectQualificationUnitStandardId",
                table: "LogbookEntries",
                column: "ProjectQualificationUnitStandardId");

            migrationBuilder.CreateIndex(
                name: "IX_Modules_CourseId",
                table: "Modules",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Modules_Order",
                table: "Modules",
                column: "Order");

            migrationBuilder.CreateIndex(
                name: "IX_Modules_Title",
                table: "Modules",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_occupational_unit_standards_qualification_id",
                table: "occupational_unit_standards",
                column: "qualification_id");

            migrationBuilder.CreateIndex(
                name: "IX_PhaseActivities_AssignedToUserId",
                table: "PhaseActivities",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PhaseActivities_ProjectPhaseId",
                table: "PhaseActivities",
                column: "ProjectPhaseId");

            migrationBuilder.CreateIndex(
                name: "IX_PhaseSubActivities_AssignedToUserId",
                table: "PhaseSubActivities",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PhaseSubActivities_PhaseActivityId",
                table: "PhaseSubActivities",
                column: "PhaseActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_ProjectId",
                table: "ProjectAssignments",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_UserId",
                table: "ProjectAssignments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLearningPathways_PathwayId",
                table: "ProjectLearningPathways",
                column: "PathwayId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLearningPathways_ProjectId",
                table: "ProjectLearningPathways",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectPhaseLearningPathways_ProjectLearningPathwayId",
                table: "ProjectPhaseLearningPathways",
                column: "ProjectLearningPathwayId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectPhaseLearningPathways_ProjectPhaseId",
                table: "ProjectPhaseLearningPathways",
                column: "ProjectPhaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectPhaseQualifications_ProjectPhaseId",
                table: "ProjectPhaseQualifications",
                column: "ProjectPhaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectPhaseQualifications_ProjectQualificationId",
                table: "ProjectPhaseQualifications",
                column: "ProjectQualificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectPhases_CreatedByUserId",
                table: "ProjectPhases",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectPhases_ProjectId",
                table: "ProjectPhases",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQualifications_LegacyQualificationId",
                table: "ProjectQualifications",
                column: "LegacyQualificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQualifications_OccupationalQualificationId",
                table: "ProjectQualifications",
                column: "OccupationalQualificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQualifications_ProjectLearningPathwayId",
                table: "ProjectQualifications",
                column: "ProjectLearningPathwayId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQualifications_QualificationTypeId",
                table: "ProjectQualifications",
                column: "QualificationTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQualificationUnitStandards_ProjectQualificationId",
                table: "ProjectQualificationUnitStandards",
                column: "ProjectQualificationId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ClientId",
                table: "Projects",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_SkillsDevelopmentProviderId",
                table: "Projects",
                column: "SkillsDevelopmentProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSites_CreatedByUserId",
                table: "ProjectSites",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSites_ProjectId",
                table: "ProjectSites",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_SickNotes_ApprovedByUserId",
                table: "SickNotes",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SickNotes_LearnerId",
                table: "SickNotes",
                column: "LearnerId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteClasses_CreatedByUserId",
                table: "SiteClasses",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteClasses_ProjectSiteId",
                table: "SiteClasses",
                column: "ProjectSiteId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillsDevelopmentProviders_ClientId",
                table: "SkillsDevelopmentProviders",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillsDevelopmentProviders_CreatedAt",
                table: "SkillsDevelopmentProviders",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SkillsDevelopmentProviders_Name",
                table: "SkillsDevelopmentProviders",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_SkillsDevelopmentProviders_Status",
                table: "SkillsDevelopmentProviders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SummativeAssessmentQuestions_SummativeAssessmentId",
                table: "SummativeAssessmentQuestions",
                column: "SummativeAssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SummativeAssessments_ProjectQualificationUnitStandardId",
                table: "SummativeAssessments",
                column: "ProjectQualificationUnitStandardId");

            migrationBuilder.CreateIndex(
                name: "IX_SystemAdmins_AccessLevel",
                table: "SystemAdmins",
                column: "AccessLevel");

            migrationBuilder.CreateIndex(
                name: "IX_SystemAdmins_Email",
                table: "SystemAdmins",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemAdmins_Status",
                table: "SystemAdmins",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SystemAdmins_Username",
                table: "SystemAdmins",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskReminders_TaskId",
                table: "TaskReminders",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AssignedToUserId",
                table: "Tasks",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_CreatedByUserId",
                table: "Tasks",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_DepartmentId",
                table: "Tasks",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ProjectId",
                table: "Tasks",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitStandardAssessments_AssessmentTypeId",
                table: "UnitStandardAssessments",
                column: "AssessmentTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitStandardAssessments_CreatedByUserId",
                table: "UnitStandardAssessments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitStandardAssessments_ProjectQualificationUnitStandardId",
                table: "UnitStandardAssessments",
                column: "ProjectQualificationUnitStandardId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ClientId",
                table: "Users",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_CreatedAt",
                table: "Users",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentId",
                table: "Users",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_Users_SkillsDevelopmentProviderId",
                table: "Users",
                column: "SkillsDevelopmentProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Status",
                table: "Users",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssessmentQuestions");

            migrationBuilder.DropTable(
                name: "AssessmentStrategyPlans");

            migrationBuilder.DropTable(
                name: "AttendanceLogs");

            migrationBuilder.DropTable(
                name: "ClassEnrollments");

            migrationBuilder.DropTable(
                name: "ClassTeachers");

            migrationBuilder.DropTable(
                name: "DocumentAccessLogs");

            migrationBuilder.DropTable(
                name: "DocumentAuditLogs");

            migrationBuilder.DropTable(
                name: "DocumentPermissions");

            migrationBuilder.DropTable(
                name: "FormativeAssessmentQuestions");

            migrationBuilder.DropTable(
                name: "LearnerAssessmentAnswers");

            migrationBuilder.DropTable(
                name: "LearnerAssessmentProgress");

            migrationBuilder.DropTable(
                name: "LearnerDocuments");

            migrationBuilder.DropTable(
                name: "legacy_unit_standards");

            migrationBuilder.DropTable(
                name: "Lessons");

            migrationBuilder.DropTable(
                name: "LogbookEntries");

            migrationBuilder.DropTable(
                name: "occupational_unit_standards");

            migrationBuilder.DropTable(
                name: "PhaseSubActivities");

            migrationBuilder.DropTable(
                name: "ProjectAssignments");

            migrationBuilder.DropTable(
                name: "ProjectPhaseLearningPathways");

            migrationBuilder.DropTable(
                name: "ProjectPhaseQualifications");

            migrationBuilder.DropTable(
                name: "SickNotes");

            migrationBuilder.DropTable(
                name: "SummativeAssessmentQuestions");

            migrationBuilder.DropTable(
                name: "SystemAdmins");

            migrationBuilder.DropTable(
                name: "TaskReminders");

            migrationBuilder.DropTable(
                name: "UnitStandardAssessments");

            migrationBuilder.DropTable(
                name: "LearnerAttendances");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "FormativeAssessments");

            migrationBuilder.DropTable(
                name: "Modules");

            migrationBuilder.DropTable(
                name: "PhaseActivities");

            migrationBuilder.DropTable(
                name: "SummativeAssessments");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "AssessmentTypes");

            migrationBuilder.DropTable(
                name: "Learners");

            migrationBuilder.DropTable(
                name: "SiteClasses");

            migrationBuilder.DropTable(
                name: "Courses");

            migrationBuilder.DropTable(
                name: "ProjectPhases");

            migrationBuilder.DropTable(
                name: "ProjectQualificationUnitStandards");

            migrationBuilder.DropTable(
                name: "ProjectSites");

            migrationBuilder.DropTable(
                name: "ProjectQualifications");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "ProjectLearningPathways");

            migrationBuilder.DropTable(
                name: "QualificationTypes");

            migrationBuilder.DropTable(
                name: "legacy_qualifications");

            migrationBuilder.DropTable(
                name: "occupational_qualifications");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "LearningPathways");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "SkillsDevelopmentProviders");

            migrationBuilder.DropTable(
                name: "Clients");
        }
    }
}
