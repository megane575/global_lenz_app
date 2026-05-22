export async function deleteFavorite({
  token,
  id,
  type,
}: {
  token: string;
  id: number;
  type: 'country' | 'comparison';
}) {
  const params = new URLSearchParams();
  if (!id) {
    throw new Error('idが不正です');
  }

  if (type === 'comparison') {
    params.append('comparison_summary_id', String(id));
  } else {
    params.append('country_summary_id', String(id));
  }

  const res = await fetch(
    `http://localhost:8000/api/favorites?${params.toString()}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('削除に失敗しました');
  }

  return res.json();
}
