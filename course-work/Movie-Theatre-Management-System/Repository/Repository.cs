using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;

namespace MovieTheatre.Repository
{
    public class Repository<T> : IRepository<T> where T : BaseEntity
    {
        protected readonly MovieTheatreDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(MovieTheatreDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }
        public async Task AddAsync(T item)
        {
            await _dbSet.AddAsync(item);
        }

        public void Delete(T item)
        {
            _dbSet.Remove(item);
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public IQueryable<T> GetAllQueryable()
        {
            return _dbSet;
        }

        public async Task<T?> GetByIdAsync(Guid id)
        {
            return await _dbSet.FindAsync(id);
        }

        public void Update(T item)
        {
            _dbSet.Update(item);
        }
    }
}
