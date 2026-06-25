type SupabaseResult<T> = {
  data: T;
  error: unknown;
};

export async function checkedSupabase<T>(
  request: PromiseLike<SupabaseResult<T>>,
  label: string,
): Promise<T> {
  const { data, error } = await request;
  if (error) {
    console.error(`${label} failed:`, error);
    throw error;
  }
  return data;
}
