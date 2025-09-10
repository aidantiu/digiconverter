#!/bin/bash

# Threshold for disk usage alert (percentage)
THRESHOLD=80

# Get disk usage percentage for root (/) partition
# df -P /        → shows POSIX-compliant output for root partition
# awk 'NR==2'    → selects the second line 
# $(NF-1)        → gets the second-to-last column, which is Capacity
# tr -d '%'      → removes the '%' sign, leaving only the number
USAGE=$(df -P / | awk 'NR==2 {print $(NF-1)}' | tr -d '%')

# Compare usage with threshold
if [ "$USAGE" -gt "$THRESHOLD" ]; then
  # If usage exceeds threshold, show an alert
  echo "ALERT: Disk usage is at ${USAGE}%, above threshold!"
else
  # Otherwise, show it's within safe limits
  echo "Disk usage is at ${USAGE}%, within safe limits."
fi
