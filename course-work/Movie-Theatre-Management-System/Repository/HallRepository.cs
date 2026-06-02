using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;

namespace MovieTheatre.Repository
{
    public class HallRepository : Repository<Hall>, IHallRepository
    {
        public HallRepository(MovieTheatreDbContext context) : base(context)
        {
        }
    }
}
