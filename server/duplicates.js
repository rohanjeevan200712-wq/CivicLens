/**
 * DUPLICATE DETECTION & CLUSTERING MODULE
 * Calculates geo-spatial distance (Haversine formula) and category match
 * to merge duplicate reports and score municipal priority queues.
 */

// Haversine formula to compute distance in meters between two lat/lng coordinates
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

const DUPLICATE_RADIUS_METERS = 150; // Within 150m radius of identical civic issue

/**
 * Checks if a new complaint is a duplicate of any existing complaint
 */
export function findDuplicateComplaints(newComplaint, existingComplaints) {
  const matches = [];

  for (const existing of existingComplaints) {
    if (existing.id === newComplaint.id) continue;
    // Don't link to resolved complaints older than 30 days
    if (existing.status === 'Resolved') continue;

    // Category match
    const categoryMatch = 
      existing.issue_category === newComplaint.issue_category ||
      (existing.responsible_department === newComplaint.responsible_department &&
       existing.responsible_department !== 'General Grievance Cell');

    if (!categoryMatch) continue;

    // Geo-distance check
    const distance = calculateDistanceMeters(
      newComplaint.location?.lat,
      newComplaint.location?.lng,
      existing.location?.lat,
      existing.location?.lng
    );

    if (distance <= DUPLICATE_RADIUS_METERS) {
      matches.push({
        complaint: existing,
        distanceMeters: distance
      });
    }
  }

  // Sort by closest distance
  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matches;
}

/**
 * Clusters an array of complaints into grouped civic hotspots.
 * Calculates priority score = severity * (1 + duplicates) * (safety_risk ? 2 : 1)
 */
export function clusterComplaints(complaints) {
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < complaints.length; i++) {
    const root = complaints[i];
    if (visited.has(root.id)) continue;

    visited.add(root.id);
    const cluster = {
      id: `cluster-${root.id}`,
      primaryComplaint: root,
      category: root.issue_category,
      department: root.responsible_department,
      centerLat: root.location?.lat,
      centerLng: root.location?.lng,
      address: root.location?.address || 'Municipal Ward Zone',
      members: [root],
      totalReports: 1 + (root.duplicateCount || 0),
      highestSeverity: root.severity || 1,
      hasSafetyRisk: Boolean(root.safety_risk),
      status: root.status || 'Submitted',
      firstReportedAt: root.createdAt,
      lastReportedAt: root.createdAt
    };

    // Find all neighbors within radius of the same category
    for (let j = i + 1; j < complaints.length; j++) {
      const candidate = complaints[j];
      if (visited.has(candidate.id)) continue;

      if (candidate.issue_category === cluster.category) {
        const dist = calculateDistanceMeters(
          cluster.centerLat,
          cluster.centerLng,
          candidate.location?.lat,
          candidate.location?.lng
        );

        if (dist <= DUPLICATE_RADIUS_METERS) {
          visited.add(candidate.id);
          cluster.members.push(candidate);
          cluster.totalReports += 1 + (candidate.duplicateCount || 0);
          cluster.highestSeverity = Math.max(cluster.highestSeverity, candidate.severity || 1);
          if (candidate.safety_risk) cluster.hasSafetyRisk = true;
          if (new Date(candidate.createdAt) > new Date(cluster.lastReportedAt)) {
            cluster.lastReportedAt = candidate.createdAt;
          }
        }
      }
    }

    // Compute municipal priority score: severity * duplicates * safety factor
    // As per hackathon prompt: severity x duplicates x safety risk
    const safetyMultiplier = cluster.hasSafetyRisk ? 2.5 : 1.0;
    const duplicateMultiplier = cluster.totalReports;
    cluster.priorityScore = Math.round(cluster.highestSeverity * duplicateMultiplier * safetyMultiplier * 10) / 10;

    clusters.push(cluster);
  }

  // Sort clusters descending by priority score
  clusters.sort((a, b) => b.priorityScore - a.priorityScore);
  return clusters;
}
