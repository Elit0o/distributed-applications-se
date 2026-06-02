using MovieTheatre.Data.Entities;

namespace MovieTheatre.Repository
{
    public interface IRepository<T> where T : BaseEntity
    {
        Task<IEnumerable<T>> GetAllAsync();
        Task<T?> GetByIdAsync(Guid id);
        Task AddAsync(T item);
        void Update(T item);
        void Delete(T item);

        IQueryable<T> GetAllQueryable();
    }
}
