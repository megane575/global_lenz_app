import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsefulLinksModal from './UsefulLinksModal';

describe('UsefulLinksModal', () => {
  it('open が false のときは何も描画しない', () => {
    const { container } = render(
      <UsefulLinksModal open={false} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('open が true のとき外務省・天気リンクが正しい URL と別タブ属性で表示される', () => {
    render(<UsefulLinksModal open onClose={() => {}} />);

    const mofa = screen.getByRole('link', { name: /外務省 安全情報/ });
    expect(mofa).toHaveAttribute('href', 'https://www.anzen.mofa.go.jp/');
    expect(mofa).toHaveAttribute('target', '_blank');
    expect(mofa).toHaveAttribute('rel', 'noopener noreferrer');

    const weather = screen.getByRole('link', { name: /各国の天気/ });
    expect(weather).toHaveAttribute('href', 'https://www.accuweather.com/');
    expect(weather).toHaveAttribute('target', '_blank');
    expect(weather).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
