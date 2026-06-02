using Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;
using MovieTheatre.Repository;

namespace MovieTheatre.Services
{
    public class BaseService<T> : IBaseService<T> where T : BaseEntity
    {
        protected readonly IRepository<T> _repository;
        protected readonly MovieTheatreDbContext _dbContext;

        public BaseService(IRepository<T> repository, MovieTheatreDbContext dbContext)
        {
            _repository = repository;
            _dbContext = dbContext;
        }

        public async Task AddAsync(T item)
        {
            await _repository.AddAsync(item);
            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteAsync(T item)
        {
            _repository.Delete(item);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
           return await _repository.GetAllAsync();
        }

        public async Task<T?> GetByIdAsync(Guid id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task UpdateAsync(T item)
        {
            _repository.Update(item);
            await _dbContext.SaveChangesAsync();
        }
    }
}
