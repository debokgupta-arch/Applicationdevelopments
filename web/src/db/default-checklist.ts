/**
 * Default modules and tasks created for every new home (spec section 7).
 * Everything here becomes ordinary editable rows: users can rename, hide,
 * reorder or delete any of it.
 */
export type ChecklistTask = { title: string; subtasks?: readonly string[] };

export type ChecklistModule = {
  name: string;
  /** lucide-react icon name. */
  icon: string;
  /** Top-level tasks start falling due this many days before move-in. */
  startDaysBeforeMoveIn: number;
  tasks: readonly ChecklistTask[];
};

const t = (title: string, subtasks?: readonly string[]): ChecklistTask =>
  subtasks ? { title, subtasks } : { title };

export const DEFAULT_CHECKLIST: readonly ChecklistModule[] = [
  {
    name: "Planning and setup",
    icon: "ClipboardList",
    startDaysBeforeMoveIn: 90,
    tasks: [t("Add home details"), t("Upload floor plan"), t("Set budget"), t("Create timeline")],
  },
  {
    name: "Site inspection and snag list",
    icon: "SearchCheck",
    startDaysBeforeMoveIn: 80,
    tasks: [
      t("Photograph each room"),
      t("Check walls, floor and ceiling for cracks and dampness"),
      t("Test taps, drains and water pressure"),
      t("Test switches, sockets and DB box"),
      t("Check doors, windows and locks"),
      t("Send snag list to builder"),
      t("Track fixes"),
    ],
  },
  {
    name: "Painting",
    icon: "PaintRoller",
    startDaysBeforeMoveIn: 60,
    tasks: [
      t("Choose colour per room"),
      t("Measure area"),
      t("Choose paint type and brand"),
      t("Get painter quotes"),
      t("Appoint painter"),
      t("Wall preparation", ["Putty", "Sanding", "Primer"]),
      t("Coat 1"),
      t("Coat 2"),
      t("Touch-ups"),
      t("Final inspection"),
      t("Payment"),
      t("Cleanup"),
    ],
  },
  {
    name: "Carpentry and modular work",
    icon: "Hammer",
    startDaysBeforeMoveIn: 70,
    tasks: [
      t("Wardrobes"),
      t("Kitchen cabinets"),
      t("TV unit"),
      t("Shoe rack"),
      t("Study table"),
      t("Upload designs and measurements"),
      t("Appoint carpenter"),
      t("Choose materials and finish"),
      t("Track milestones", ["Measurement", "Material delivery", "Fitting", "Polish"]),
      t("Check finished work"),
    ],
  },
  {
    name: "Electrical",
    icon: "Zap",
    startDaysBeforeMoveIn: 65,
    tasks: [
      t("Plan light, fan, AC and socket points"),
      t("Buy fixtures"),
      t("Appoint electrician"),
      t("Wiring"),
      t("Install geyser, exhaust fans and inverter", ["Geyser", "Exhaust fans", "Inverter"]),
      t("Test all points"),
    ],
  },
  {
    name: "Plumbing and bathrooms",
    icon: "ShowerHead",
    startDaysBeforeMoveIn: 65,
    tasks: [
      t("Sanitaryware"),
      t("Taps"),
      t("Showers"),
      t("Water purifier and washing machine points"),
      t("Waterproofing check"),
      t("Drainage test"),
    ],
  },
  {
    name: "Flooring and civil work",
    icon: "Layers",
    startDaysBeforeMoveIn: 75,
    tasks: [
      t("Tiles or flooring changes"),
      t("Polishing"),
      t("Wall breaking"),
      t("False ceiling"),
      t("Partitions"),
    ],
  },
  {
    name: "Appliances and ACs",
    icon: "AirVent",
    startDaysBeforeMoveIn: 30,
    tasks: [
      t("Buy or shift appliances", [
        "AC",
        "Fridge",
        "Washing machine",
        "TV",
        "Chimney",
        "Purifier",
      ]),
      t("Book installation"),
      t("Track delivery and warranty cards"),
    ],
  },
  {
    name: "Curtains, blinds and fittings",
    icon: "Blinds",
    startDaysBeforeMoveIn: 30,
    tasks: [
      t("Measure windows"),
      t("Choose fabric and blinds"),
      t("Stitching and installation"),
      t("Mosquito nets"),
      t("Grills"),
      t("Curtain rods"),
      t("Hooks"),
    ],
  },
  {
    name: "Utilities and paperwork",
    icon: "ReceiptText",
    startDaysBeforeMoveIn: 45,
    tasks: [
      t("Electricity meter transfer"),
      t("Water connection"),
      t("Gas connection"),
      t("Internet"),
      t("DTH"),
      t("Society registration and move-in permission"),
      t("Update address", ["Aadhaar", "Bank", "Office records"]),
      t("End rent agreement"),
    ],
  },
  {
    name: "Deep cleaning",
    icon: "Sparkles",
    startDaysBeforeMoveIn: 14,
    tasks: [
      t("Post-construction cleaning"),
      t("Pest control"),
      t("Sanitisation"),
      t("Book agency"),
    ],
  },
  {
    name: "Packing and moving",
    icon: "Package",
    startDaysBeforeMoveIn: 21,
    tasks: [
      t("Room-wise packing checklist"),
      t("Inventory with photos"),
      t("Labelled boxes"),
      t("Packer and mover quotes"),
      t("Book movers and date"),
      t("Insurance for valuables"),
      t("Lift and parking booking"),
    ],
  },
  {
    name: "Furniture and decor",
    icon: "Sofa",
    startDaysBeforeMoveIn: 25,
    tasks: [
      t("Buy furniture (check against floor plan)"),
      t("Placement"),
      t("Mattresses"),
      t("Sofa"),
      t("Dining table"),
      t("Plants"),
      t("Mirrors"),
      t("Art"),
    ],
  },
  {
    name: "Moving day and after",
    icon: "Truck",
    startDaysBeforeMoveIn: 0,
    tasks: [
      t("Day-of checklist"),
      t("Unpacking room by room"),
      t("Settling-in checklist"),
      t("Housewarming planning"),
    ],
  },
];
