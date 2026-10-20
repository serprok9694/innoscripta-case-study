import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';
import { selectThemeMode, setThemeMode, type ThemeMode } from '../theme-slice';

const OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSettings() {
  const mode = useAppSelector(selectThemeMode);
  const dispatch = useAppDispatch();

  return (
    <SegmentedControl
      label="Theme"
      options={OPTIONS}
      value={mode}
      onChange={(value) => dispatch(setThemeMode(value))}
    />
  );
}
