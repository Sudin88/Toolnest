import { Activity, CalendarClock, CalendarRange, Landmark, Percent, Ruler } from "lucide-react";

import type { ToolDefinition } from "@/lib/tools/types";

export const calculatorTools: ToolDefinition[] = [
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    category: "calculators",
    tagline: "Percent of, percent change, and increase or decrease",
    description:
      "Work out a percentage of a number, what percentage one number is of another, and the percentage increase or decrease between two values.",
    icon: Percent,
    keywords: ["percentage calculator", "percent change", "percentage increase", "what is x percent of y"],
    local: true,
    status: "live",
    rank: 90,
    added: "2026-08-04",
    howTo: [
      "Pick the question you are actually asking — the three boxes answer different things.",
      "Enter your numbers and read the result, which updates as you type.",
      "Check the formula line underneath. It shows the arithmetic that produced the answer, so you can confirm the tool understood the question.",
    ],
    faqs: [
      {
        q: "What is the difference between percent change and percentage points?",
        a: "A move from 10 percent to 15 percent is a 5 percentage point rise but a 50 percent increase, because the change is measured against the starting value of 10.",
      },
      {
        q: "Why does an increase followed by the matching decrease not return the original number?",
        a: "Percentages are not reversible that way. A 50 percent rise needs a 33 percent fall to get back, because the second calculation uses a larger base.",
      },
    ],
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    category: "calculators",
    tagline: "Exact age in years, months, days and totals",
    description:
      "Calculate an exact age in years, months and days from a birth date, with total days, weeks, hours and the next birthday countdown.",
    icon: CalendarClock,
    keywords: ["age calculator", "how old am i", "date of birth calculator", "age in days"],
    local: true,
    status: "live",
    rank: 84,
    added: "2026-08-07",
    howTo: [
      "Enter the date of birth and the date to measure against — today by default.",
      "Read the exact age in years, months and days.",
      "Use the totals when a form needs a single figure in days or weeks.",
      "Check the next-birthday line, which handles the 29 February case explicitly.",
    ],
    faqs: [
      {
        q: "How is age counted on a leap day?",
        a: "Someone born on 29 February is treated as having their birthday on 1 March in non-leap years, which is the convention most legal systems use.",
      },
      {
        q: "Does the calculation use calendar months or fixed 30-day months?",
        a: "Calendar months, so the result matches how a person would count their own age rather than an average month length.",
      },
    ],
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    category: "calculators",
    tagline: "Body mass index in metric or imperial units",
    description:
      "Calculate body mass index from height and weight in metric or imperial units, with the standard category band and the caveats that make it an estimate.",
    icon: Activity,
    keywords: ["bmi calculator", "body mass index", "bmi chart", "healthy weight range"],
    local: true,
    status: "live",
    rank: 80,
    added: "2026-08-07",
    howTo: [
      "Switch to metric or imperial, whichever you know your measurements in.",
      "Enter your height and weight.",
      "Read the BMI figure and the category band it falls in.",
      "Use the healthy-weight range for your height as a reference point, not a target.",
    ],
    faqs: [
      {
        q: "Is BMI a diagnosis?",
        a: "No. BMI is a population-level screening number. It cannot tell the difference between muscle and fat, and it does not account for age, sex, ethnicity or body composition. Treat the result as one input, and talk to a clinician about your health.",
      },
      {
        q: "Why is BMI adjusted for some populations?",
        a: "Risk thresholds differ by population — for people of South Asian descent, for example, health risk rises at a lower BMI, which is why some health services use 23 rather than 25 as the upper bound of the healthy band.",
      },
      {
        q: "Should children use this calculator?",
        a: "No. Children and teenagers need BMI-for-age percentiles rather than the adult bands, because body composition changes rapidly with growth. Use a paediatric chart instead.",
      },
    ],
    limits: [
      "BMI is a screening figure, not a diagnosis — it cannot distinguish muscle from fat or account for where fat is carried.",
      "It is not valid during pregnancy, for athletes with high muscle mass, or for children, who need age percentiles instead.",
      "It uses only height and weight; it knows nothing about your health history.",
    ],
  },
  {
    slug: "loan-calculator",
    name: "Loan Calculator",
    category: "calculators",
    tagline: "Monthly payment, total interest and amortisation",
    description:
      "Work out the monthly repayment on a loan from the amount, interest rate and term, and see total interest alongside a full amortisation schedule.",
    icon: Landmark,
    keywords: ["loan calculator", "monthly payment calculator", "amortisation schedule", "interest calculator"],
    local: true,
    status: "live",
    rank: 86,
    added: "2026-08-09",
    howTo: [
      "Enter the amount borrowed, the annual interest rate and the term in years or months.",
      "Read the monthly payment, the total repaid and the total interest.",
      "Open the schedule to see how each payment splits between interest and principal over the life of the loan.",
      "Compare an extra monthly payment against the baseline to see how much interest it removes.",
    ],
    faqs: [
      {
        q: "How is the monthly payment calculated?",
        a: "With the standard amortisation formula: payment equals principal times the periodic rate, divided by one minus the periodic rate raised to the negative number of periods. The tool shows the formula it used.",
      },
      {
        q: "Does this include fees, insurance or tax?",
        a: "No. The result covers principal and interest only. Arrangement fees, insurance and any tax are added on top by the lender, so the amount you actually pay will be higher.",
      },
      {
        q: "Why do the early payments go almost entirely to interest?",
        a: "Interest is charged on the outstanding balance, which is at its largest at the start. As the balance falls, the interest portion falls with it and the principal portion grows.",
      },
    ],
    limits: [
      "The result covers principal and interest only — no fees, insurance, tax or late charges.",
      "It assumes a fixed rate and a fixed payment for the whole term, so variable rates and payment holidays are not modelled.",
      "It is an estimate, not a lender's offer or financial advice.",
    ],
  },
  {
    slug: "date-difference-calculator",
    name: "Date Difference Calculator",
    category: "calculators",
    tagline: "Days, weeks and months between two dates",
    description:
      "Find the exact difference between two dates in days, weeks, months and years, with the option to exclude weekends or count only business days.",
    icon: CalendarRange,
    keywords: ["date difference", "days between dates", "business days calculator", "date duration"],
    local: true,
    status: "live",
    rank: 78,
    added: "2026-08-13",
    howTo: [
      "Set the start and end dates. The order does not matter — the tool reports the direction.",
      "Read the difference in each unit; the breakdown into years, months and days is the one people usually need.",
      "Turn on business days to exclude Saturdays and Sundays, which is what most deadlines actually mean.",
      "Add the project or notice period to the end date to find a deadline.",
    ],
    faqs: [
      {
        q: "Are the end dates inclusive?",
        a: "No, the difference is exclusive of the end date by default, so 1 March to 2 March is one day. There is a switch to include the final day, which is what event planning usually wants.",
      },
      {
        q: "Does the business-day count account for public holidays?",
        a: "Only weekends are excluded. Public holidays vary by country and year, so they are not assumed — subtract them yourself from the business-day total.",
      },
    ],
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    category: "calculators",
    tagline: "Length, weight, temperature and volume",
    description:
      "Convert between common units of length, weight, volume and temperature, including the offset conversions that catch people out.",
    icon: Ruler,
    keywords: ["unit converter", "metric to imperial", "cm to inches", "kg to lbs", "celsius to fahrenheit"],
    local: true,
    status: "live",
    rank: 88,
    added: "2026-08-13",
    howTo: [
      "Choose a category — length, weight, volume or temperature.",
      "Set the units you are converting from and to.",
      "Type a value and read the converted result.",
      "Open the reference table to see the full set of units at a glance instead of converting one at a time.",
    ],
    faqs: [
      {
        q: "Why is temperature different from the other categories?",
        a: "Length, weight and volume scale by multiplying, so 0 stays 0. Temperature scales have an offset, so converting Celsius to Fahrenheit needs a multiplication and an addition. The tool applies the correct formula per unit.",
      },
      {
        q: "Is the US gallon the same as the imperial gallon?",
        a: "No, and this trips people up constantly. A US gallon is about 3.785 litres while an imperial gallon is about 4.546 litres. Both are available as separate units.",
      },
      {
        q: "How precise are the conversions?",
        a: "Conversion factors are exact where the standard defines them, and accurate to at least ten significant figures elsewhere. Displayed precision is rounded for readability.",
      },
    ],
  },
];
