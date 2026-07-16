export interface Section {
  key: string;
  label: string;
  /** Phone-only sections render locked on the web build. */
  phoneOnly: boolean;
}

export const SECTIONS: readonly Section[] = [
  { key: 'today', label: 'Today', phoneOnly: false },
  { key: 'routine', label: 'Routine', phoneOnly: false },
  { key: 'health', label: 'Health', phoneOnly: true },
  { key: 'substances', label: 'Substances', phoneOnly: true },
  { key: 'journals', label: 'Journals', phoneOnly: false },
  { key: 'contacts', label: 'Contacts', phoneOnly: false },
  { key: 'ideas', label: 'Ideas', phoneOnly: false },
  { key: 'goals', label: 'Goals', phoneOnly: false },
];

/** The five slots on the phone tab bar; the last opens the rest. */
export const PHONE_TABS = ['today', 'routine', 'health', 'journals', 'more'] as const;
