-- CreateEnum
CREATE TYPE "EmployeeSource" AS ENUM ('LOGO_SALESMAN', 'LOGO_PERSONNEL', 'LOCAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SUMMER', 'WINTER', 'ALL_SEASON');

-- CreateEnum
CREATE TYPE "TireSetStatus" AS ENUM ('IN_STORAGE', 'DELIVERED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "RimType" AS ENUM ('NONE', 'STEEL', 'ALLOY');

-- CreateEnum
CREATE TYPE "TirePosition" AS ENUM ('FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT', 'REAR_RIGHT', 'SPARE', 'OTHER');

-- CreateEnum
CREATE TYPE "TireCondition" AS ENUM ('GOOD', 'WORN', 'DAMAGED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('CHECK_IN', 'RELOCATE', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'DAMAGE');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CHECK_IN', 'SWAP', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "logoRef" INTEGER,
    "logoCode" TEXT,
    "name" TEXT NOT NULL,
    "isPerson" BOOLEAN NOT NULL DEFAULT true,
    "tckn" TEXT,
    "taxNr" TEXT,
    "taxOffice" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "source" "EmployeeSource" NOT NULL DEFAULT 'LOCAL',
    "logoRef" INTEGER,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "employeeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "aisle" TEXT,
    "rack" TEXT,
    "level" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireSet" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vehicleId" INTEGER,
    "season" "Season" NOT NULL,
    "status" "TireSetStatus" NOT NULL DEFAULT 'IN_STORAGE',
    "rimType" "RimType" NOT NULL DEFAULT 'NONE',
    "quantity" INTEGER NOT NULL DEFAULT 4,
    "hasHubcaps" BOOLEAN NOT NULL DEFAULT false,
    "hasBolts" BOOLEAN NOT NULL DEFAULT false,
    "currentLocationId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TireSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tire" (
    "id" SERIAL NOT NULL,
    "tireSetId" INTEGER NOT NULL,
    "position" "TirePosition" NOT NULL,
    "brand" TEXT NOT NULL,
    "pattern" TEXT,
    "width" INTEGER NOT NULL,
    "aspectRatio" INTEGER NOT NULL,
    "rimDiameter" DECIMAL(4,1) NOT NULL,
    "loadIndex" INTEGER,
    "speedIndex" TEXT,
    "dot" TEXT,
    "treadDepthMm" DECIMAL(3,1),
    "condition" "TireCondition" NOT NULL DEFAULT 'GOOD',
    "note" TEXT,

    CONSTRAINT "Tire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stay" (
    "id" SERIAL NOT NULL,
    "tireSetId" INTEGER NOT NULL,
    "seasonLabel" TEXT,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInById" INTEGER,
    "mileageKm" INTEGER,
    "checkOutAt" TIMESTAMP(3),
    "checkOutById" INTEGER,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "logoInvoiceRef" INTEGER,
    "note" TEXT,

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireMovement" (
    "id" SERIAL NOT NULL,
    "tireSetId" INTEGER NOT NULL,
    "type" "MovementType" NOT NULL,
    "fromLocationId" INTEGER,
    "toLocationId" INTEGER,
    "employeeId" INTEGER,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "TireMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TirePhoto" (
    "id" SERIAL NOT NULL,
    "tireSetId" INTEGER NOT NULL,
    "stayId" INTEGER,
    "kind" "PhotoKind" NOT NULL,
    "path" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TirePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vehicleId" INTEGER,
    "tireSetId" INTEGER,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_logoRef_key" ON "Customer"("logoRef");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_source_logoRef_key" ON "Employee"("source", "logoRef");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_branchId_code_key" ON "Warehouse"("branchId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_warehouseId_code_key" ON "StorageLocation"("warehouseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_customerId_idx" ON "Vehicle"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "TireSet_code_key" ON "TireSet"("code");

-- CreateIndex
CREATE INDEX "TireSet_customerId_idx" ON "TireSet"("customerId");

-- CreateIndex
CREATE INDEX "TireSet_status_idx" ON "TireSet"("status");

-- CreateIndex
CREATE INDEX "TireSet_currentLocationId_idx" ON "TireSet"("currentLocationId");

-- CreateIndex
CREATE INDEX "Tire_tireSetId_idx" ON "Tire"("tireSetId");

-- CreateIndex
CREATE INDEX "Stay_tireSetId_idx" ON "Stay"("tireSetId");

-- CreateIndex
CREATE INDEX "Stay_checkOutAt_idx" ON "Stay"("checkOutAt");

-- CreateIndex
CREATE INDEX "TireMovement_tireSetId_at_idx" ON "TireMovement"("tireSetId", "at");

-- CreateIndex
CREATE INDEX "TirePhoto_tireSetId_idx" ON "TirePhoto"("tireSetId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireSet" ADD CONSTRAINT "TireSet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireSet" ADD CONSTRAINT "TireSet_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireSet" ADD CONSTRAINT "TireSet_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tire" ADD CONSTRAINT "Tire_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_checkInById_fkey" FOREIGN KEY ("checkInById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_checkOutById_fkey" FOREIGN KEY ("checkOutById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireMovement" ADD CONSTRAINT "TireMovement_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireMovement" ADD CONSTRAINT "TireMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireMovement" ADD CONSTRAINT "TireMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireMovement" ADD CONSTRAINT "TireMovement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TirePhoto" ADD CONSTRAINT "TirePhoto_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TirePhoto" ADD CONSTRAINT "TirePhoto_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "Stay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
