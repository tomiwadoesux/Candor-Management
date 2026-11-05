// Apply each turn in camera space, so horizontal input always turns around
// the screen's vertical axis, even after the globe has tilted or wandered.
export function rotatePoints(points, yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  for (const point of points) {
    const x = point.x * cy + point.z * sy;
    const z = point.z * cy - point.x * sy;
    const y = point.y * cx - z * sx;
    point.z = point.y * sx + z * cx;
    point.x = x;
    point.y = y;
  }
}

// Same critically damped 0.4s response as the proximity rail. Exact
// integration preserves velocity when the hand reverses direction.
const OMEGA = 2 * Math.PI / 0.4;
export function advanceSpring(spring, seconds) {
  const previous = spring.value;
  const error = spring.value - spring.target;
  const velocity = spring.velocity + OMEGA * error;
  const decay = Math.exp(-OMEGA * seconds);
  spring.value = spring.target + (error + velocity * seconds) * decay;
  spring.velocity = (spring.velocity - OMEGA * velocity * seconds) * decay;
  if (Math.abs(spring.target - spring.value) < 0.00001 && Math.abs(spring.velocity) < 0.0001) {
    spring.value = spring.target;
    spring.velocity = 0;
  }
  return spring.value - previous;
}

// Carry release velocity into ambient rotation with the existing 0.4s
// response. Integrate displacement exactly so refresh rate cannot change it.
export function advanceCoast(coast, seconds) {
  const decay = Math.exp(-seconds / 0.4);
  const distance = 0.4 * (1 - decay);
  const movement = { x: coast.x * distance, y: coast.y * distance };
  coast.x *= decay;
  coast.y *= decay;
  return movement;
}

// A straight middle with circular end caps. The phase keeps travelling;
// velocity rounds through zero at each endpoint without a stationary hold.
// Each cap uses the same 0.4s response as dragging, independent of frame rate.
export function advanceScroll(scroll, seconds, speed, limit) {
  if (limit <= 0) { scroll.position = 0; return; }
  const position = Math.max(0, Math.min(limit, scroll.position));
  const cap = Math.min(speed * 0.4, limit / 2);
  if (cap <= 0) return;
  const arc = cap * Math.PI / 2;
  const straight = limit - 2 * cap;
  const length = straight + 2 * arc;
  let along;
  if (position < cap) along = cap * Math.acos(1 - position / cap);
  else if (position > limit - cap) along = arc + straight + cap * Math.asin((position - limit + cap) / cap);
  else along = arc + position - cap;
  const phase = ((scroll.direction > 0 ? along : 2 * length - along)
    + speed * seconds) % (2 * length);
  const travel = phase <= length ? phase : 2 * length - phase;
  if (travel < arc) scroll.position = cap * (1 - Math.cos(travel / cap));
  else if (travel > arc + straight) scroll.position = limit - cap + cap * Math.sin((travel - arc - straight) / cap);
  else scroll.position = cap + travel - arc;
  scroll.direction = phase < length ? 1 : -1;
}
