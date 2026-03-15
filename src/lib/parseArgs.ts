/**
 * Generic POSIX-style argument parser for the terminal emulator.
 *
 * Handles:
 *  - Combined short flags: -la → { l: true, a: true }
 *  - Separate short flags: -l -a → same
 *  - Flags with values: -n 5, -d ","
 *  - Long flags: --verbose (treated as boolean)
 *  - Positional (non-flag) arguments
 *  - Unknown-flag validation
 */

export interface ParsedArgs {
  /** Boolean flags that were set (e.g. { l: true, a: true }) */
  flags: Record<string, boolean>;
  /** Flags that take a value (e.g. { n: "5", d: "," }) */
  values: Record<string, string>;
  /** Non-flag positional arguments */
  positional: string[];
}

export interface FlagSpec {
  /** Flags that are simple booleans, e.g. ['l','a','h','t'] */
  booleans?: string[];
  /** Flags that consume the next arg as a value, e.g. ['n','d','f'] */
  withValue?: string[];
  /** Command name, used in error messages */
  command?: string;
}

/**
 * Parse an args array according to the given spec.
 * Returns parsed result plus an optional error string for unknown flags.
 */
export function parseArgs(
  args: string[],
  spec: FlagSpec = {}
): { parsed: ParsedArgs; error?: string } {
  const boolSet = new Set(spec.booleans || []);
  const valueSet = new Set(spec.withValue || []);
  const allKnown = new Set([...boolSet, ...valueSet]);
  const cmd = spec.command || '';

  const flags: Record<string, boolean> = {};
  const values: Record<string, string> = {};
  const positional: string[] = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    // Long flag --something → treat as boolean
    if (arg.startsWith('--') && arg.length > 2) {
      const name = arg.slice(2);
      flags[name] = true;
      i++;
      continue;
    }

    // Short flag(s) starting with -
    if (arg.startsWith('-') && arg.length > 1 && !/^-\d/.test(arg)) {
      const chars = arg.slice(1).split('');

      for (let j = 0; j < chars.length; j++) {
        const ch = chars[j];

        if (valueSet.has(ch)) {
          // Value flag — rest of this token or next arg is the value
          const rest = chars.slice(j + 1).join('');
          if (rest) {
            values[ch] = rest;
          } else if (i + 1 < args.length) {
            i++;
            values[ch] = args[i];
          }
          flags[ch] = true;
          break; // rest consumed
        }

        if (boolSet.has(ch)) {
          flags[ch] = true;
        } else if (allKnown.size > 0) {
          // Unknown flag
          return {
            parsed: { flags, values, positional },
            error: `${cmd}: invalid option -- '${ch}'`,
          };
        } else {
          // No spec given — accept anything as boolean
          flags[ch] = true;
        }
      }
      i++;
      continue;
    }

    // Positional argument
    positional.push(arg);
    i++;
  }

  return { parsed: { flags, values, positional } };
}
