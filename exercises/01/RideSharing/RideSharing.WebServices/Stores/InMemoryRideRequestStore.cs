using RideSharing.Contracts;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace RideSharing.WebServices.Stores;

public interface IRideRequestStore
{
    void Add(RideRequest request);
    RideRequest GetById(Guid requestId);
    IReadOnlyList<RideRequest> GetAll();
}

public class InMemoryRideRequestStore : IRideRequestStore
{
    private readonly ConcurrentDictionary<Guid, RideRequest> _requests = new();

    public void Add(RideRequest request)
    {
        _requests[request.RequestId] = request;
    }

    public RideRequest GetById(Guid requestId)
    {
        _requests.TryGetValue(requestId, out var request);
        return request;
    }

    public IReadOnlyList<RideRequest> GetAll()
    {
        return [.. _requests.Values];
    }
}
