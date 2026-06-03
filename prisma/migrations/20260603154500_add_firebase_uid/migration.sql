BEGIN TRY

BEGIN TRAN;

-- AlterTable: Firebase holds the password now, so drop the local hash and add the Firebase link.
ALTER TABLE [dbo].[User] DROP COLUMN [passwordHash];
ALTER TABLE [dbo].[User] ADD [firebaseUid] NVARCHAR(1000);

-- CreateIndex: filtered unique index so multiple existing NULLs are allowed (SQL Server only
-- permits one NULL in a plain unique index). EXEC defers compilation until after the column exists.
EXEC('CREATE UNIQUE INDEX [User_firebaseUid_key] ON [dbo].[User]([firebaseUid]) WHERE [firebaseUid] IS NOT NULL');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
