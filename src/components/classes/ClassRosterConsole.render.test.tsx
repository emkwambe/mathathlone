import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import ClassRosterConsole from './ClassRosterConsole';

// Server render (no DOM in this repo's test setup): proves when the billing controls are rendered.
// styled-jsx's <style jsx global> is not compiled under Vitest, so React warns about the `jsx` attribute; silence it.
let errorSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => { errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined); });
afterAll(() => { errorSpy.mockRestore(); });

const render = (props: { billingEnabled?: boolean; isPro?: boolean }) => renderToStaticMarkup(<ClassRosterConsole {...props} />);

describe('ClassRosterConsole billing controls', () => {
  it('renders an enabled "Manage billing" button, before Refresh, only when billing is on and the user is Pro', () => {
    const html = render({ billingEnabled: true, isPro: true });
    expect(html).toContain('Manage billing');
    const button = html.slice(html.lastIndexOf('<button', html.indexOf('Manage billing')), html.indexOf('</button>', html.indexOf('Manage billing')));
    expect(button).toContain('type="button"');
    expect(button).not.toMatch(/\sdisabled=""/);
    expect(html.indexOf('Manage billing')).toBeLessThan(html.indexOf('Refresh'));
  });

  it('does not render "Manage billing" for a free user, or when billing is off', () => {
    expect(render({ billingEnabled: true, isPro: false })).not.toContain('Manage billing');
    expect(render({ billingEnabled: false, isPro: true })).not.toContain('Manage billing');
    expect(render({})).not.toContain('Manage billing');
  });

  it('never renders the upgrade prompt on first render (it appears only after a 402 from class creation)', () => {
    expect(render({ billingEnabled: true, isPro: false })).not.toContain('Upgrade to Pro');
  });
});
