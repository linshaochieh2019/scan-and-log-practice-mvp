import { render, screen } from '@testing-library/react-native';

import { MonoText } from '@/components/StyledText';

describe('smoke test', () => {
  it('renders text content', () => {
    render(<MonoText>Jest setup works</MonoText>);

    expect(screen.getByText('Jest setup works')).toBeTruthy();
  });
});
