export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];
export type ClassValue =
	ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined;

export type Constructor<T = unknown> = new (...args: unknown[]) => T;

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Flattens and merges class names into a single string without external dependencies.
 *
 * @param {...ClassValue[]} classes - List of class names, arrays, or conditional values.
 * @returns {string} Space-separated class names string.
 */
export const cn = (...classes: ClassValue[]): string => {
	return classes.flat(10).filter(Boolean).join(' ');
};
