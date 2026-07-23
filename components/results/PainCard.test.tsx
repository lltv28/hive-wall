import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VideoPlaceholder from './PainCard';

describe('PainCard', () => {
  it('uses the shared section card wrapper and centers the video card', () => {
    render(<VideoPlaceholder />);

    expect(screen.getByText('Walkthrough Preview')).toBeInTheDocument();

    const videoCard = screen.getByTestId('results-video-card');
    expect(videoCard).toHaveStyle({
      maxWidth: '360px',
      marginLeft: 'auto',
      marginRight: 'auto',
    });
  });
});
