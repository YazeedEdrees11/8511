BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProductInquiry] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT,
    [itemName] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [sizeEu] NVARCHAR(1000),
    [budget] DECIMAL(10,2),
    [notes] NVARCHAR(max),
    [contactName] NVARCHAR(1000) NOT NULL,
    [contactEmail] NVARCHAR(1000) NOT NULL,
    [contactPhone] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ProductInquiry_status_df] DEFAULT 'new',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductInquiry_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProductInquiry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ProductInquiry] ADD CONSTRAINT [ProductInquiry_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
