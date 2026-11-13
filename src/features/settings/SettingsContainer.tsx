import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
// Profile (avatar/bio), Social (messages) and Notifications (email) are
// hidden until the backend supports them; their forms are in ./sections.
import { Gamepad2, LayoutDashboard, Palette, ShieldCheck } from "lucide-react";
import { BoardSettingsForm } from "./sections/BoardSettingsForm";
import { GameplaySettingsForm } from "./sections/GameplaySettingsForm";
import { InterfaceSettingsForm } from "./sections/InterfaceSettingsForm";
import { AccountSettingsForm } from "./sections/account/AccountSettingsForm";

const sections = [
  {
    value: "board",
    label: "Board",
    icon: Palette,
    description: "How the board looks and sounds",
    component: BoardSettingsForm,
  },
  {
    value: "gameplay",
    label: "Gameplay",
    icon: Gamepad2,
    description: "How moves and game actions work",
    component: GameplaySettingsForm,
  },
  {
    value: "interface",
    label: "Interface",
    icon: LayoutDashboard,
    description: "Theme and what the app shows during games",
    component: InterfaceSettingsForm,
  },
  {
    value: "account",
    label: "Account",
    icon: ShieldCheck,
    description: "Your password and account",
    component: AccountSettingsForm,
  },
];

export const SettingsContainer = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      // "multiple": opening a section leaves the others alone. With one open
      // at a time, the section above would close as this one opened and pull
      // the header you just tapped up the screen
      <Accordion
        type="multiple"
        className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card"
      >
        {sections.map(
          ({ value, label, icon: Icon, description, component: Component }) => (
            <AccordionItem key={value} value={value} className="border-border/70 px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="size-[18px] text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{description}</p>
                  {Component && <Component />}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        )}
      </Accordion>
    );
  }

  return (
    <Tabs
      defaultValue="board"
      orientation="vertical"
      className="grid w-full grid-cols-[220px_minmax(0,1fr)] items-start gap-8"
    >
      <TabsList
        aria-label="Settings sections"
        className="sticky top-8 flex h-auto w-full flex-col items-stretch gap-0.5 bg-transparent p-0"
      >
        {sections.map(({ icon: Icon, label, value }) => (
          <TabsTrigger
            value={value}
            key={value}
            className="h-10 justify-start gap-3 rounded-lg border-0 px-3 text-sm font-medium text-muted-foreground shadow-none hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-accent dark:text-muted-foreground"
          >
            <Icon className="size-[18px]" aria-hidden="true" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map(({ value, label, description, component: Component }) => (
        <TabsContent
          key={value}
          value={value}
          className="rounded-2xl border border-border/70 bg-card p-6"
        >
          <div className="space-y-4">
            <div className="border-b border-border/70 pb-4">
              <h2 className="text-lg font-semibold">{label}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
            {Component && <Component />}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};
