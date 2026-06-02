using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Entities;

namespace MovieTheatre.Data.Persistance
{
    public class MovieTheatreDbContext : DbContext
    {
        public MovieTheatreDbContext(DbContextOptions<MovieTheatreDbContext> options) : base(options)
        {

        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Hall> Halls => Set<Hall>();
        public DbSet<Movie> Movies => Set<Movie>();
        public DbSet<Screening> Screenings => Set<Screening>();
        public DbSet<Ticket> Tickets => Set<Ticket>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasKey(u => u.Id);
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = new Guid("11111111-1111-1111-1111-111111111111"),
                    FName = "admin",
                    LName = "admin",
                    Username = "admin",
                    PasswordHash = "admin",
                    Birthday = new DateTime(2003, 12, 31),
                    IsAdmin = true
                }
            );

            modelBuilder.Entity<Hall>().HasKey(h => h.Id);
            modelBuilder.Entity<Movie>().HasKey(m => m.Id);
            modelBuilder.Entity<Screening>().HasKey(s => s.Id);
            modelBuilder.Entity<Ticket>().HasKey(t => t.Id);

            modelBuilder.Entity<Screening>()
                .HasOne(s => s.Movie)
                .WithMany(m => m.Screenings)
                .HasForeignKey(s => s.MovieId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Screening>()
                .HasOne(s => s.Hall)
                .WithMany(h => h.Screenings)
                .HasForeignKey(s => s.HallId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tickets)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Screening)
                .WithMany(s => s.Tickets)
                .HasForeignKey(t => t.ScreeningId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
