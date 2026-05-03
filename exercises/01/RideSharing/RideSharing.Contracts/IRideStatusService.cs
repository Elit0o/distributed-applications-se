using System.ServiceModel;

namespace RideSharing.Contracts;

[ServiceContract]
public interface IRideStatusService
{
    [OperationContract]
    RideStatus GetRideStatus(Guid requestId);
}
