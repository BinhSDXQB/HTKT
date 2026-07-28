-- CreateEnum
CREATE TYPE "AdministrativeUnitType" AS ENUM ('TINH', 'QUAN_HUYEN', 'PHUONG_XA');

-- CreateEnum
CREATE TYPE "InfrastructureDomain" AS ENUM ('GIAO_THONG', 'CAP_NUOC', 'THOAT_NUOC', 'CHIEU_SANG', 'CAY_XANH', 'MOI_TRUONG', 'CHINH_TRANG');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('TOT', 'KHA', 'TRUNG_BINH', 'XAU', 'HONG');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DANG_SU_DUNG', 'DUNG_TAM', 'DANG_SUA_CHUA', 'NGUNG_SU_DUNG', 'THOAI_HOA');

-- CreateEnum
CREATE TYPE "MaintenanceFrequency" AS ENUM ('HANG_NGAY', 'HANG_TUAN', 'HANG_THANG', 'QUY', 'NAM_THANG', 'HANG_NAM');

-- CreateEnum
CREATE TYPE "InspectionInputType" AS ENUM ('RATING', 'YES_NO', 'TEXT', 'NUMBER', 'PHOTO');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('NHAP', 'DANG_KIEM', 'HOAN_THANH', 'HUY');

-- CreateEnum
CREATE TYPE "IncidentSource" AS ENUM ('BAO_CAO_NV', 'PHAN_ANH_CD', 'KET_QUA_KIEM', 'HE_THONG');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('THAP', 'TRUNG', 'CAO', 'KHAN_CAP');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('MOI', 'DA_TIEP_NHAN', 'DANG_XU_LY', 'TAM_DUNG', 'DA_GIAI_QUYET', 'DONG');

-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('BAO_TRI_DINH_KY', 'SUA_CHUA', 'KIEM_TRA', 'NAO_VET', 'THAY_THE', 'CAI_TAO');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('MOI', 'DA_GIAO', 'DANG_THUC_HIEN', 'TAM_DUNG', 'HOAN_THANH', 'NGHIEM_THU', 'HUY');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('THAP', 'TRUNG', 'CAO', 'KHAN_CAP');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('XAY_MOI', 'CAI_TAO', 'BAO_TRI_LON', 'KHAC');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('CHUAN_BI', 'DA_DUYET', 'DANG_THUC_HIEN', 'NGHIEM_THU', 'HAN_THANH', 'TAM_DUNG', 'HUY');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('NHAP_KHO', 'XUAT_KHO', 'DIEU_CHUYEN', 'KIEM_KE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BAO_TRI_QUA_HAN', 'KIEM_TRA_QUA_HAN', 'SU_CO_KHAN_CAP', 'CONG_TRINH_QUA_HAN', 'VAT_TU_THIEU', 'ASSET_XAU_HONG');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "detail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrative_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "type" "AdministrativeUnitType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "administrative_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wardId" TEXT,
    "length" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "streets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "InfrastructureDomain" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executing_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "executing_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "domain" "InfrastructureDomain" NOT NULL,
    "address" TEXT,
    "wardId" TEXT,
    "streetId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "installDate" DATE,
    "warrantyExpiry" DATE,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "condition" "AssetCondition" NOT NULL DEFAULT 'TOT',
    "status" "AssetStatus" NOT NULL DEFAULT 'DANG_SU_DUNG',
    "techSpecs" JSONB,
    "notes" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetTypeId" TEXT,
    "assetId" TEXT,
    "frequency" "MaintenanceFrequency" NOT NULL,
    "description" TEXT,
    "lastDoneAt" DATE,
    "nextDueAt" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "InfrastructureDomain" NOT NULL,
    "assetTypeId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inputType" "InspectionInputType" NOT NULL DEFAULT 'RATING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "inspection_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "inspectionCode" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "inspectedAt" TIMESTAMP(3),
    "conditionBefore" "AssetCondition",
    "conditionAfter" "AssetCondition",
    "overallRating" DOUBLE PRECISION,
    "summary" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'NHAP',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_results" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "rating" INTEGER,
    "yesNo" BOOLEAN,
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "inspection_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" "IncidentSource" NOT NULL DEFAULT 'BAO_CAO_NV',
    "domain" "InfrastructureDomain" NOT NULL,
    "assetId" TEXT,
    "inspectionId" TEXT,
    "address" TEXT,
    "wardId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priority" "IncidentPriority" NOT NULL DEFAULT 'TRUNG',
    "status" "IncidentStatus" NOT NULL DEFAULT 'MOI',
    "reportedById" TEXT,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "resolvedById" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3),
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workOrderCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "WorkOrderType" NOT NULL,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'TRUNG',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'MOI',
    "domain" "InfrastructureDomain" NOT NULL,
    "assetId" TEXT,
    "incidentId" TEXT,
    "scheduleId" TEXT,
    "executingUnitId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "plannedStart" DATE,
    "plannedEnd" DATE,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "description" TEXT,
    "resolution" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_materials" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "materialId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "work_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "InfrastructureDomain" NOT NULL,
    "type" "ProjectType" NOT NULL DEFAULT 'XAY_MOI',
    "status" "ProjectStatus" NOT NULL DEFAULT 'CHUAN_BI',
    "location" TEXT,
    "wardId" TEXT,
    "investor" TEXT,
    "executingUnitId" TEXT,
    "supervisor" TEXT,
    "totalBudget" DOUBLE PRECISION,
    "fundingSource" TEXT,
    "spentAmount" DOUBLE PRECISION,
    "approvalDate" DATE,
    "startDate" DATE,
    "endDate" DATE,
    "actualEndDate" DATE,
    "decisionNumber" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plannedDate" DATE NOT NULL,
    "actualDate" DATE,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "material_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "reference" TEXT,
    "note" TEXT,
    "transactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_config" (
    "id" TEXT NOT NULL,
    "tenCoQuan" TEXT NOT NULL DEFAULT '',
    "tenDonVi" TEXT NOT NULL DEFAULT '',
    "diaChi" TEXT NOT NULL DEFAULT '',
    "dienThoai" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "administrative_units_code_key" ON "administrative_units"("code");

-- CreateIndex
CREATE INDEX "administrative_units_type_idx" ON "administrative_units"("type");

-- CreateIndex
CREATE UNIQUE INDEX "streets_code_key" ON "streets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_code_key" ON "asset_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "executing_units_code_key" ON "executing_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetCode_key" ON "assets"("assetCode");

-- CreateIndex
CREATE INDEX "assets_domain_idx" ON "assets"("domain");

-- CreateIndex
CREATE INDEX "assets_wardId_idx" ON "assets"("wardId");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_condition_idx" ON "assets"("condition");

-- CreateIndex
CREATE UNIQUE INDEX "inspections_inspectionCode_key" ON "inspections"("inspectionCode");

-- CreateIndex
CREATE INDEX "inspections_assetId_idx" ON "inspections"("assetId");

-- CreateIndex
CREATE INDEX "inspections_scheduledDate_idx" ON "inspections"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_results_inspectionId_itemId_key" ON "inspection_results"("inspectionId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_incidentCode_key" ON "incidents"("incidentCode");

-- CreateIndex
CREATE INDEX "incidents_domain_idx" ON "incidents"("domain");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_priority_idx" ON "incidents"("priority");

-- CreateIndex
CREATE INDEX "incidents_reportedAt_idx" ON "incidents"("reportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workOrderCode_key" ON "work_orders"("workOrderCode");

-- CreateIndex
CREATE INDEX "work_orders_domain_idx" ON "work_orders"("domain");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_plannedStart_idx" ON "work_orders"("plannedStart");

-- CreateIndex
CREATE INDEX "work_orders_assetId_idx" ON "work_orders"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectCode_key" ON "projects"("projectCode");

-- CreateIndex
CREATE INDEX "projects_domain_idx" ON "projects"("domain");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "material_categories_code_key" ON "material_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code");

-- CreateIndex
CREATE INDEX "stock_transactions_materialId_idx" ON "stock_transactions"("materialId");

-- CreateIndex
CREATE INDEX "stock_transactions_type_idx" ON "stock_transactions"("type");

-- CreateIndex
CREATE INDEX "system_alerts_isRead_isResolved_idx" ON "system_alerts"("isRead", "isResolved");

-- CreateIndex
CREATE INDEX "system_alerts_type_idx" ON "system_alerts"("type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_units" ADD CONSTRAINT "administrative_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streets" ADD CONSTRAINT "streets_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "streets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "asset_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_template_items" ADD CONSTRAINT "inspection_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inspection_template_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_executingUnitId_fkey" FOREIGN KEY ("executingUnitId") REFERENCES "executing_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_executingUnitId_fkey" FOREIGN KEY ("executingUnitId") REFERENCES "executing_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_categories" ADD CONSTRAINT "material_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "material_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
