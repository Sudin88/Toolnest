"use client";

import { Check, NumberInput, Segmented, Select, TextInput } from "@/components/tools/interactive";
import { SubHeading } from "@/components/tools/parts";
import { QR_MODES, type QrContact, type QrLevel, type QrMode, type QrWifi } from "@/lib/qr";

/**
 * The controls half of the QR code generator. Mode, the mode-specific fields and
 * the appearance settings all live in one state object the parent owns, so this
 * component only renders the inputs and hands a patch back — the payload
 * arithmetic and the canvas stay with the parent.
 */
export interface QrFormState {
  mode: QrMode;
  link: string;
  text: string;
  wifi: QrWifi;
  contact: QrContact;
  size: number | "";
  margin: number | "";
  level: QrLevel;
  fg: string;
  bg: string;
  transparent: boolean;
}

export function QrCodeForm({
  value,
  onChange,
}: {
  value: QrFormState;
  onChange: (patch: Partial<QrFormState>) => void;
}) {
  const { mode, link, text, wifi, contact, size, margin, level, fg, bg, transparent } = value;

  return (
    <>
      <Segmented<QrMode>
        label="What are you encoding?"
        value={mode}
        onChange={(next) => onChange({ mode: next })}
        options={QR_MODES}
      />

      {mode === "link" ? (
        <TextInput
          label="Link"
          value={link}
          onChange={(next) => onChange({ link: next })}
          inputMode="url"
          placeholder="example.com/page"
          hint="A bare domain is given an https:// prefix so the scan opens correctly."
        />
      ) : null}

      {mode === "text" ? (
        <TextInput label="Text" value={text} onChange={(next) => onChange({ text: next })} />
      ) : null}

      {mode === "wifi" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Network name (SSID)"
            value={wifi.ssid}
            onChange={(next) => onChange({ wifi: { ...wifi, ssid: next } })}
            placeholder="HomeWifi"
          />
          <Select
            label="Security"
            value={wifi.encryption}
            onChange={(next) => onChange({ wifi: { ...wifi, encryption: next } })}
            options={[
              { value: "WPA", label: "WPA / WPA2 / WPA3" },
              { value: "WEP", label: "WEP (legacy)" },
              { value: "nopass", label: "Open, no password" },
            ]}
          />
          {wifi.encryption !== "nopass" ? (
            <TextInput
              label="Password"
              value={wifi.password}
              onChange={(next) => onChange({ wifi: { ...wifi, password: next } })}
              className="sm:col-span-2"
            />
          ) : null}
          <Check
            label="This network is hidden"
            checked={wifi.hidden}
            onChange={(next) => onChange({ wifi: { ...wifi, hidden: next } })}
            hint="Adds the hidden flag so phones ask for the SSID explicitly."
          />
        </div>
      ) : null}

      {mode === "contact" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Full name"
            value={contact.name}
            onChange={(next) => onChange({ contact: { ...contact, name: next } })}
            placeholder="Ada Lovelace"
          />
          <TextInput
            label="Organisation"
            value={contact.org}
            onChange={(next) => onChange({ contact: { ...contact, org: next } })}
            placeholder="Optional"
          />
          <TextInput
            label="Phone"
            value={contact.phone}
            onChange={(next) => onChange({ contact: { ...contact, phone: next } })}
            inputMode="text"
            placeholder="+1 555 0100"
          />
          <TextInput
            label="Email"
            value={contact.email}
            onChange={(next) => onChange({ contact: { ...contact, email: next } })}
            inputMode="text"
            placeholder="ada@example.com"
          />
          <TextInput
            label="Website"
            value={contact.website}
            onChange={(next) => onChange({ contact: { ...contact, website: next } })}
            inputMode="url"
            placeholder="Optional"
          />
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
        <legend className="sr-only">Appearance</legend>
        <SubHeading>Appearance</SubHeading>
        <div className="grid gap-5 sm:grid-cols-3">
          <NumberInput
            label="Size (px)"
            value={size}
            onChange={(next) => onChange({ size: next })}
            min={96}
            max={1024}
            step={16}
          />
          <NumberInput
            label="Margin (modules)"
            value={margin}
            onChange={(next) => onChange({ margin: next })}
            min={0}
            max={8}
            hint="The quiet zone scanners need."
          />
          <Select
            label="Error correction"
            value={level}
            onChange={(next) => onChange({ level: next as QrLevel })}
            options={[
              { value: "L", label: "Low (7%)" },
              { value: "M", label: "Medium (15%) — recommended" },
              { value: "Q", label: "Quartile (25%)" },
              { value: "H", label: "High (30%)" },
            ]}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="qr-fg">Foreground</label>
            <input
              id="qr-fg"
              type="color"
              value={fg}
              onChange={(event) => onChange({ fg: event.target.value })}
              className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface-2 p-1"
            />
          </div>
          <div>
            <label className="label" htmlFor="qr-bg">Background</label>
            <input
              id="qr-bg"
              type="color"
              value={bg}
              onChange={(event) => onChange({ bg: event.target.value })}
              disabled={transparent}
              className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface-2 p-1 disabled:opacity-50"
            />
          </div>
        </div>
        <Check
          label="Transparent background"
          checked={transparent}
          onChange={(next) => onChange({ transparent: next })}
          hint="Useful over light artwork. Keep a light background in the layout itself, or the scanner may not find the code."
        />
      </fieldset>
    </>
  );
}
