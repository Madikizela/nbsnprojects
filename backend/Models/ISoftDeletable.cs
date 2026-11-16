namespace backend.Models
{
    /// <summary>
    /// Marks an entity as soft-deletable.
    /// When IsDeleted = true the global query filter in ApplicationDbContext
    /// excludes the row from all normal queries.
    /// </summary>
    public interface ISoftDeletable
    {
        bool      IsDeleted        { get; set; }
        DateTime? DeletedAt        { get; set; }
        int?      DeletedByUserId  { get; set; }
    }

    /// <summary>
    /// Extension helpers — call entity.SoftDelete(userId) instead of
    /// _context.Remove(entity) everywhere in controllers.
    /// </summary>
    public static class SoftDeleteExtensions
    {
        public static void SoftDelete(this ISoftDeletable entity, int? deletedByUserId = null)
        {
            entity.IsDeleted       = true;
            entity.DeletedAt       = DateTime.UtcNow;
            entity.DeletedByUserId = deletedByUserId;
        }

        public static void Restore(this ISoftDeletable entity)
        {
            entity.IsDeleted       = false;
            entity.DeletedAt       = null;
            entity.DeletedByUserId = null;
        }
    }
}
