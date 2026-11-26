/**
 * Dynamic block: nothing is saved, the server renders on every request.
 * No save output means no save-drift and no editor recovery prompts.
 */
export default function save(): null {
	return null;
}
