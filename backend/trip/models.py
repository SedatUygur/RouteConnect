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