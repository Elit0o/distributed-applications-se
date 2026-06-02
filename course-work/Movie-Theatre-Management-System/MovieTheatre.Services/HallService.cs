using Microsoft.EntityFrameworkCore;
using MovieTheatre.Contracts.DTOs.Requests.Halls;
using MovieTheatre.Contracts.DTOs.Requests.Users;
using MovieTheatre.Contracts.DTOs.Responses.Halls;
using MovieTheatre.Contracts.DTOs.Responses.Screenings;
using MovieTheatre.Contracts.Interfaces;
using MovieTheatre.Data.Entities;
using MovieTheatre.Data.Persistance;
using MovieTheatre.Repository;
using System;
using System.Collections.Generic;
using System.Text;

namespace MovieTheatre.Services
{
    public class HallService : BaseService<Hall>, IHallService
    {
        private readonly IHallRepository _hallRepository;

        public HallService(IHallRepository repository, MovieTheatreDbContext dbContext) : base(repository, dbContext)
        {
            _hallRepository = repository;
        }

        public Hall CreateHall(HallRequest hallRequest)
        {
            DateTime modifiedOn = DateTime.UtcNow;
            return new Hall
            {
                Id = Guid.NewGuid(),
                HallNum = hallRequest.HallNum,
                SeatsCount = hallRequest.SeatsCount,
                Is3D = hallRequest.Is3D,
                SoundSystem = hallRequest.SoundSystem,
                IsPremium = hallRequest.IsPremium,
                CreatedOn = modifiedOn,
                UpdatedOn = modifiedOn
            };
        }

        public async Task<HallPageResponse> GetPagedAllHalls(HallPageRequest hallPageRequest)
        {
            int page = Math.Max(hallPageRequest.Page, 1);
            int pageSize = Math.Clamp(hallPageRequest.PageSize, 1, 30);

            var hallQuery = _repository.GetAllQueryable();

            if (!string.IsNullOrWhiteSpace(hallPageRequest.MinSeatCount.ToString()))
            {
                hallQuery = hallQuery.Where(h => h.SeatsCount >= hallPageRequest.MinSeatCount);
            }

            if (!string.IsNullOrWhiteSpace(hallPageRequest.MaxSeatCount.ToString()))
            {
                hallQuery = hallQuery.Where(h => h.SeatsCount <= hallPageRequest.MaxSeatCount);
            }

            if (hallPageRequest.Is3D.HasValue)
            {
                hallQuery = hallQuery.Where(h => h.Is3D == hallPageRequest.Is3D.Value);
            }

            string sortBy = hallPageRequest.SortBy ?? nameof(Hall.HallNum);
            hallQuery = sortBy switch
            {
                nameof(Hall.SeatsCount) => hallPageRequest.IsDescending ? hallQuery.OrderByDescending(h => h.SeatsCount) : hallQuery.OrderBy(h => h.SeatsCount),
                nameof(Hall.Is3D) => hallPageRequest.IsDescending ? hallQuery.OrderByDescending(h => h.Is3D) : hallQuery.OrderBy(h => h.Is3D),
                nameof(Hall.HallNum) => hallPageRequest.IsDescending ? hallQuery.OrderByDescending(h => h.HallNum) : hallQuery.OrderBy(h => h.HallNum),
                _ => hallPageRequest.IsDescending ? hallQuery.OrderByDescending(h => h.HallNum) : hallQuery.OrderBy(h => h.HallNum),
            };

            var totalItems = await hallQuery.CountAsync();

            var halls = await hallQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(h => new HallResponse
                {
                    Id = h.Id,
                    HallNum = h.HallNum,
                    SeatsCount = h.SeatsCount,
                    Is3D = h.Is3D,
                    SoundSystem = h.SoundSystem.ToString(),
                    IsPremium = h.IsPremium
                })
                .ToListAsync();
            return new HallPageResponse
            {
                Items = halls,
                TotalCount = totalItems,
                Page = page,
                PageSize = pageSize,
                IsDescending = hallPageRequest.IsDescending,
                MinSeatCount = hallPageRequest.MinSeatCount,
                MaxSeatCount = hallPageRequest.MaxSeatCount,
                Is3D = hallPageRequest.Is3D
            };
        }

        public HallDetailsResponse MapToResponse(Hall hall)
        {
            return new HallDetailsResponse
            {
                Id = hall.Id,
                HallNum = hall.HallNum,
                SeatsCount = hall.SeatsCount,
                Is3D = hall.Is3D,
                SoundSystem = hall.SoundSystem.ToString(),
                IsPremium = hall.IsPremium,
                Screenings = hall.Screenings.Select(s => new ScreeningResponse
                {
                    Id = s.Id,
                    MovieTitle = s.Movie.Title,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    HallId = s.HallId,
                    Price = s.Price,
                    Type = s.Type.ToString()
                }).ToList()
            };
        }

        public Hall UpdateHall(HallRequest hallRequest, Hall hall)
        {
            hall.HallNum = hallRequest.HallNum;
            hall.SeatsCount = hallRequest.SeatsCount;
            hall.Is3D = hallRequest.Is3D;
            hall.SoundSystem = hallRequest.SoundSystem;
            hall.IsPremium = hallRequest.IsPremium;
            
            return hall;
        }
    }
}
