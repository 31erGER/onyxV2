// Restyled to the neumorphic design system. Re-exports NeuButton so all
// existing callers (styled(Button), <Button $primary/$danger>) keep working
// while inheriting neumorphic surface/gradient/danger variants and shadows.
export { default } from "../neumorphic/NeuButton";
