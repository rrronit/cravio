export function currentUserId(request: Request) {
  return request.headers.get('x-user-id')?.trim() || 'demo-user';
}
