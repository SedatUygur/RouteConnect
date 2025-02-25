from django.db import models

# Create your models here.
class Trip(models.Model):
    """
    Stores the basic trip info.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours_used = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_distance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_duration = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Trip {self.id} from {self.pickup_location} to {self.dropoff_location}"
    
class Stop(models.Model):
    """
    Each Stop can be fueling, rest, pickup, dropoff, etc.
    """
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    stop_type = models.CharField(max_length=50)  # e.g. "Fuel", "Pickup", "Dropoff", "Rest"
    location = models.CharField(max_length=255)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.stop_type} stop at {self.location}"