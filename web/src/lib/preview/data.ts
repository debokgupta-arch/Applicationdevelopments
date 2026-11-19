/**
 * Demo data for the interactive preview of v2 sections 4 and 5 (floor plan,
 * Module > Task > Sub-task with the eight task types). Mirrors the v2 schema
 * so the same shapes can be loaded from the database later. All invented.
 */
import { addDays, format } from "date-fns";
import type { Status, TaskType } from "@/lib/hierarchy";

export type Finish = "matte" | "satin" | "gloss";

export type PRoom = {
  id: string;
  name: string;
  lengthFt: number | null;
  widthFt: number | null;
  areaSqft: number | null;
  rect: PRect | null;
};
export type PRect = { x: number; y: number; w: number; h: number };
export type PFloor = {
  id: string;
  label: string;
  totalAreaSqft: number | null;
  planUrl: string | null;
  rooms: PRoom[];
};

export type PContact = {
  id: string;
  name: string;
  company: string;
  phone: string;
  rate: number | null;
  isAppointed: boolean;
};
export type PSelection = {
  id: string;
  roomId: string;
  colorHex: string;
  colorName: string;
  finish: Finish;
  brand: string;
  quantity: number | null;
  unit: string;
  expectedCost: number | null;
};
export type PPayment = {
  id: string;
  payee: string;
  amount: number;
  paidOn: string | null;
  mode: string;
  status: "due" | "paid";
};
export type PStage = {
  id: string;
  name: string;
  status: Status;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  amount: number | null;
};
export type PMaterial = { id: string; material: string; quantity: number | null; unit: string };
export type PLineItem = {
  id: string;
  roomId: string;
  name: string;
  quantity: number | null;
  unit: string;
  expectedCost: number | null;
  actualCost: number | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  status: Status;
  stages: PStage[];
  materials: PMaterial[];
  designs: string[];
};

export type PNode = {
  id: string;
  title: string;
  status: Status;
  taskType: TaskType;
  notes: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  expectedCost: number | null;
  actualCost: number | null;
  manualProgress: number | null;
  isCustom: boolean;
  children: PNode[];
  contacts: PContact[];
  selections: PSelection[];
  payments: PPayment[];
  spaces: { roomId: string; percent: number }[];
  lineItems: PLineItem[];
  stages: PStage[];
};

export type PModule = { id: string; name: string; icon: string; tasks: PNode[] };

export const uid = () => crypto.randomUUID();
const d = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");

export function node(title: string, taskType: TaskType, extra: Partial<PNode> = {}): PNode {
  return {
    id: uid(),
    title,
    status: "pending",
    taskType,
    notes: "",
    plannedStart: null,
    plannedEnd: null,
    actualStart: null,
    actualEnd: null,
    expectedCost: null,
    actualCost: null,
    manualProgress: null,
    isCustom: false,
    children: [],
    contacts: [],
    selections: [],
    payments: [],
    spaces: [],
    lineItems: [],
    stages: [],
    ...extra,
  };
}

export function stage(
  name: string,
  status: Status = "pending",
  extra: Partial<PStage> = {},
): PStage {
  return {
    id: uid(),
    name,
    status,
    plannedStart: null,
    plannedEnd: null,
    actualStart: null,
    actualEnd: null,
    amount: null,
    ...extra,
  };
}

export function lineItem(roomId: string, name: string, extra: Partial<PLineItem> = {}): PLineItem {
  return {
    id: uid(),
    roomId,
    name,
    quantity: 1,
    unit: "nos",
    expectedCost: null,
    actualCost: null,
    plannedStart: null,
    plannedEnd: null,
    actualStart: null,
    actualEnd: null,
    status: "pending",
    stages: [],
    materials: [],
    designs: [],
    ...extra,
  };
}

const PROCUREMENT = ["Quote received", "Procured", "Installed"];
const procurement = (doneCount: number) =>
  PROCUREMENT.map((name, i) =>
    stage(name, i < doneCount ? "done" : i === doneCount ? "in_progress" : "pending"),
  );

export function demoFloors(): PFloor[] {
  const room = (name: string, l: number, w: number): PRoom => ({
    id: uid(),
    name,
    lengthFt: l,
    widthFt: w,
    areaSqft: l * w,
    rect: null,
  });
  return [
    {
      id: uid(),
      label: "Ground",
      totalAreaSqft: 1150,
      planUrl: null,
      rooms: [
        room("Living", 16, 20),
        room("Master bedroom", 14, 13),
        room("Kids room", 12, 11),
        room("Kitchen", 10, 11),
        room("Bath", 8, 6),
        room("Balcony", 10, 6),
      ],
    },
    {
      id: uid(),
      label: "Terrace",
      totalAreaSqft: 400,
      planUrl: null,
      rooms: [room("Open terrace", 20, 15)],
    },
  ];
}

/** The five default modules from v2 section 6, with demo progress. */
export function demoModules(rooms: readonly PRoom[]): PModule[] {
  const r = (name: string) => rooms.find((x) => x.name === name)?.id ?? rooms[0].id;
  const perItem = "Handled per line item in the first task.";

  const painting: PModule = {
    id: "painting",
    name: "Painting",
    icon: "PaintRoller",
    tasks: [
      node("Selection of colour and quantity", "selection", {
        status: "in_progress",
        plannedStart: d(-10),
        plannedEnd: d(5),
        expectedCost: 42000,
        selections: [
          {
            id: uid(),
            roomId: r("Living"),
            colorHex: "#D8E3DC",
            colorName: "Sage Whisper",
            finish: "matte",
            brand: "Asian Paints",
            quantity: 18,
            unit: "L",
            expectedCost: 9000,
          },
          {
            id: uid(),
            roomId: r("Master bedroom"),
            colorHex: "#E8D3CF",
            colorName: "Dusty Rose",
            finish: "satin",
            brand: "Berger",
            quantity: 12,
            unit: "L",
            expectedCost: 7200,
          },
        ],
      }),
      node("Painter appointment", "contact", {
        status: "done",
        contacts: [
          {
            id: uid(),
            name: "Ravi Kumar",
            company: "Ravi Painters",
            phone: "+919000000001",
            rate: 45000,
            isAppointed: true,
          },
          {
            id: uid(),
            name: "Imran",
            company: "Colour Craft",
            phone: "+919000000004",
            rate: 52000,
            isAppointed: false,
          },
        ],
      }),
      node("Cost monitor", "cost_monitor", {
        status: "in_progress",
        expectedCost: 60000,
        payments: [
          {
            id: uid(),
            payee: "City Paint Store",
            amount: 18500,
            paidOn: d(-8),
            mode: "UPI",
            status: "paid",
          },
          {
            id: uid(),
            payee: "Ravi Painters (advance)",
            amount: 15000,
            paidOn: d(-3),
            mode: "Bank transfer",
            status: "paid",
          },
          {
            id: uid(),
            payee: "Ravi Painters (final)",
            amount: 30000,
            paidOn: null,
            mode: "Bank transfer",
            status: "due",
          },
        ],
        children: [
          node("Payment to paint store", "plain", {
            status: "done",
            expectedCost: 20000,
            actualCost: 18500,
          }),
          node("Payment to painter", "plain", {
            status: "in_progress",
            expectedCost: 40000,
            actualCost: 15000,
          }),
        ],
      }),
      node("Start date and end date - planned", "schedule", {
        status: "in_progress",
        plannedStart: d(-5),
        plannedEnd: d(12),
        actualStart: d(-3),
      }),
      node("Progress vs plan", "space_progress", {
        status: "in_progress",
        plannedStart: d(-5),
        plannedEnd: d(12),
        spaces: [
          { roomId: r("Living"), percent: 80 },
          { roomId: r("Master bedroom"), percent: 40 },
          { roomId: r("Kids room"), percent: 0 },
          { roomId: r("Kitchen"), percent: 100 },
          { roomId: r("Bath"), percent: 0 },
          { roomId: r("Balcony"), percent: 20 },
        ],
      }),
    ],
  };

  const carpentry: PModule = {
    id: "carpentry",
    name: "Carpentry",
    icon: "Hammer",
    tasks: [
      node("Room-wise furniture planning", "line_items", {
        status: "in_progress",
        lineItems: [
          lineItem(r("Master bedroom"), "Wardrobe (8 ft, sliding)", {
            expectedCost: 85000,
            actualCost: 92000,
            plannedStart: d(-20),
            plannedEnd: d(-2),
            actualStart: d(-18),
            status: "in_progress",
            stages: [
              stage("Measurement", "done"),
              stage("Material delivery", "done"),
              stage("Fitting", "in_progress"),
              stage("Polish"),
            ],
            materials: [
              { id: uid(), material: "Plywood 18 mm", quantity: 8, unit: "sheets" },
              { id: uid(), material: "Laminate", quantity: 10, unit: "sheets" },
              { id: uid(), material: "Soft-close hinges", quantity: 12, unit: "pcs" },
            ],
            designs: ["wardrobe-design-v2.pdf"],
          }),
          lineItem(r("Living"), "TV unit", {
            expectedCost: 35000,
            plannedStart: d(2),
            plannedEnd: d(15),
            stages: [
              stage("Measurement", "done"),
              stage("Material delivery"),
              stage("Fitting"),
              stage("Polish"),
            ],
            materials: [{ id: uid(), material: "Plywood 12 mm", quantity: 3, unit: "sheets" }],
          }),
          lineItem(r("Kids room"), "Study table", {
            expectedCost: 18000,
            plannedStart: d(5),
            plannedEnd: d(18),
            stages: [
              stage("Measurement"),
              stage("Material delivery"),
              stage("Fitting"),
              stage("Polish"),
            ],
          }),
        ],
      }),
      node("Upload of design against each requirement", "plain", { notes: perItem }),
      node("List of material required (room-wise and furniture-wise)", "plain", { notes: perItem }),
      node("Enter actual cost", "plain", { notes: perItem }),
      node("Actual start and end date", "schedule", {
        plannedStart: d(-20),
        plannedEnd: d(18),
        actualStart: d(-18),
      }),
    ],
  };

  const appliances: PModule = {
    id: "appliances",
    name: "Appliance fitting and accessories",
    icon: "AirVent",
    tasks: [
      node("List of appliances, room-wise", "line_items", {
        status: "in_progress",
        lineItems: [
          lineItem(r("Living"), "Ceiling fan", {
            quantity: 2,
            expectedCost: 7000,
            stages: procurement(2),
            plannedEnd: d(6),
          }),
          lineItem(r("Bath"), "Geyser 25 L", {
            expectedCost: 9500,
            actualCost: 9100,
            stages: procurement(3),
            status: "done",
          }),
          lineItem(r("Master bedroom"), "Split AC 1.5 t", {
            expectedCost: 42000,
            stages: procurement(1),
            plannedEnd: d(10),
          }),
          lineItem(r("Kitchen"), "Chimney", {
            expectedCost: 15000,
            stages: procurement(0),
            plannedEnd: d(14),
          }),
        ],
      }),
      node("Expected cost for each line item", "plain", { notes: perItem }),
      node("Procurement stages per line item", "plain", {
        notes:
          "Quote received → Procured (invoice, warranty card) → Installed. Tracked on each line item.",
      }),
      node("Enter actual cost", "plain", { notes: perItem }),
      node("Actual start and end date", "schedule", { plannedStart: d(-2), plannedEnd: d(14) }),
    ],
  };

  const electrical: PModule = {
    id: "electrical",
    name: "Electrical",
    icon: "Zap",
    tasks: [
      node("Electrician details and contact number", "contact", {
        status: "done",
        contacts: [
          {
            id: uid(),
            name: "Suresh",
            company: "BrightSpark Electricals",
            phone: "+919000000003",
            rate: 38000,
            isAppointed: true,
          },
        ],
      }),
      node("Plan: points per room (upload or enter manually)", "line_items", {
        lineItems: [
          lineItem(r("Living"), "Light points", { quantity: 6, expectedCost: 4800 }),
          lineItem(r("Living"), "Power sockets", { quantity: 4, expectedCost: 3200 }),
          lineItem(r("Kitchen"), "Chimney + oven points", { quantity: 2, expectedCost: 2600 }),
        ],
      }),
      node("Stages", "stages", {
        status: "in_progress",
        stages: [
          stage("Material procured", "done", {
            plannedEnd: d(-12),
            actualEnd: d(-11),
            amount: 14000,
          }),
          stage("Electrician appointed", "done", {
            plannedStart: d(-10),
            plannedEnd: d(-1),
            actualStart: d(-9),
          }),
          stage("Wiring done", "in_progress", {
            plannedStart: d(-9),
            plannedEnd: d(-1),
            actualStart: d(-8),
          }),
        ],
        plannedStart: d(-12),
        plannedEnd: d(-1),
      }),
      node("Enter actual cost", "plain", {
        expectedCost: 38000,
        actualCost: 24000,
        status: "in_progress",
      }),
      node("Actual start and end date", "schedule", {
        plannedStart: d(-12),
        plannedEnd: d(-1),
        actualStart: d(-11),
      }),
    ],
  };

  const plumbing: PModule = {
    id: "plumbing",
    name: "Plumbing",
    icon: "ShowerHead",
    tasks: [
      node("Plumber details and contact number", "contact", {
        contacts: [
          {
            id: uid(),
            name: "Mahesh",
            company: "AquaFix",
            phone: "+919000000005",
            rate: 22000,
            isAppointed: false,
          },
        ],
      }),
      node("Planning the fittings (room-wise)", "line_items", {
        lineItems: [
          lineItem(r("Bath"), "Wall-mounted WC", { expectedCost: 14000, plannedEnd: d(20) }),
          lineItem(r("Bath"), "Shower mixer", { expectedCost: 6500, plannedEnd: d(20) }),
          lineItem(r("Kitchen"), "Sink + tap", { expectedCost: 8000, plannedEnd: d(22) }),
        ],
      }),
      node("Stages", "stages", {
        stages: [
          stage("Planning the fittings", "in_progress"),
          stage("Procurement of fittings"),
          stage("Installation"),
        ],
      }),
      node("Enter actual cost", "plain"),
      node("Actual start and end date", "schedule", { plannedStart: d(8), plannedEnd: d(25) }),
    ],
  };

  return [painting, carpentry, appliances, electrical, plumbing];
}
