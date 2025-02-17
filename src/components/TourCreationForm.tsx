"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Link from "next/link";

import createTour from "@/lib/createTour";
import getTour from "@/lib/getTour";
import updateTour from "@/lib/updateTour";

import DateInput from "@/components/TourCreationFormInput/DateInput";
import DeleteBtn from "@/components/TourCreationFormInput/DeleteBtn";

import formSchema from "@/model/formSchema";
import { buttonVariants } from "@/components/ui/button";

const location_types = [
  "Hotel",
  "Attraction",
  "Restaurant",
  "Meeting Point",
  "Other",
];

interface Tour {
  name: string;
  startDate: Date;
  endDate: Date;
  refundDueDate: Date;
  overviewLocation: string;
  description: string;
  price: number;
  maxMemberCount: [number];
  activities: {
    name: string;
    description: string;
    startTimestamp: Date;
    endTimestamp: Date;
    location: {
      name: string;
      latitude: number;
      longitude: number;
      type: "Hotel" | "Attraction" | "Restaurant" | "Meeting Point" | "Other";
      address: string;
    };
  }[];
}

let oldValues: Tour = {
  name: "",
  startDate: new Date(),
  endDate: new Date(),
  refundDueDate: new Date(),
  overviewLocation: "",
  description: "",
  price: 1,
  maxMemberCount: [50],
  activities: [
    {
      name: "",
      description: "",
      startTimestamp: new Date(),
      endTimestamp: new Date(),
      location: {
        name: "",
        latitude: 0,
        longitude: 0,
        type: "Other",
        address: "",
      },
    },
  ],
};

const activityAPIinDEV = true; // need to check if the activity API is in development or not
export default function TourCreationForm({ tourId }: { tourId?: string }) {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startDate: new Date(),
      endDate: new Date(),
      refundDueDate: new Date(),
      overviewLocation: "",
      description: "",
      price: 1,
      maxMemberCount: [50],
      activities: [
        {
          name: "",
          description: "",
          startTimestamp: new Date(),
          endTimestamp: new Date(),
          location: {
            name: "",
            latitude: 0,
            longitude: 0,
            type: "Other",
            address: "",
          },
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "activities",
  });
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated. (Only run when valid)
    const tempMax = values.maxMemberCount[0];
    const sentValues = JSON.parse(
      JSON.stringify(values).replace(
        /"maxMemberCount":\[\d+\]/,
        `"maxMemberCount":${tempMax}`,
      ),
    );
    sentValues.startDate = new Date(sentValues.startDate);
    sentValues.endDate = new Date(sentValues.endDate);
    sentValues.refundDueDate = new Date(sentValues.refundDueDate);
    // sentValues.maxMemberCount = [sentValues.maxMemberCount]
    if (sentValues.activities != null && sentValues.activities.length !== 0) {
      sentValues.activities = sentValues.activities.map((activity: any) => {
        activity.startTimestamp = new Date(activity.startTimestamp);
        activity.endTimestamp = new Date(activity.endTimestamp);
        return activity;
      });
    }
    if (!tourId) {
      const res = await createTour("token", sentValues);
      if (!res.success) {
        toast({
          title: "Failed to create tour",
          description: "Please try again",
        });
        return;
      }
      toast({
        title: "Form submitted!",
        description: `${sentValues.name} is created`,
      });
      return;
    } else {
      // console.log(sentValues)
      const res = await updateTour("token", sentValues, oldValues, tourId);
      if (!res.success) {
        toast({
          title: "Failed to update tour",
          description: "Please try again",
        });
        return;
      }
      toast({
        title: "Form submitted!",
        description: `${sentValues.name} is updated`,
      });
      return;
    }
  }
  async function getValue() {
    if (tourId) {
      const res = await getTour(tourId);
      // console.log(res.data)
      let values = res.data;
      // console.log(values)
      values.startDate = new Date(values.startDate);
      values.endDate = new Date(values.endDate);
      values.refundDueDate = new Date(values.refundDueDate);
      values.maxMemberCount = [values.maxMemberCount];
      if (values.activities != null && values.activities.length !== 0) {
        values.activities = values.activities.map((activity: any) => {
          activity.startTimestamp = new Date(activity.startTimestamp);
          activity.endTimestamp = new Date(activity.endTimestamp);
          return activity;
        });
      }
      // console.log(values)
      oldValues = values;
      form.reset(res.data);
    }
  }
  useEffect(() => {
    getValue();
  });

  return (
    <div className="p-5">
      <Link
        className={buttonVariants({ variant: "outline" })}
        href="/agency/tours"
      >
        Back
      </Link>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-10 mt-7 space-y-8 overflow-hidden p-5"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex w-full justify-between">
                    <input
                      className="block border-0 text-5xl font-bold decoration-1 underline-offset-2 outline-none focus:underline"
                      placeholder="Tour Name"
                      spellCheck="false"
                      autoComplete="false"
                      {...field}
                    ></input>
                    {tourId ? (
                      <div className="flex items-center justify-end gap-4">
                        <Label htmlFor="deleteBtn" className="text-slate-400">
                          Delete the tour?
                        </Label>
                        <DeleteBtn token="token" tourId={tourId} />
                      </div>
                    ) : null}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap gap-8">
            <DateInput form={form} name="startDate" label="Start Date" />
            <DateInput form={form} name="endDate" label="End Date" />
            <DateInput
              form={form}
              name="refundDueDate"
              label="Refund Due Date"
            />
          </div>
          <FormField
            control={form.control}
            name="overviewLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overview Location</FormLabel>
                <FormControl>
                  <Input placeholder="ex. Doi Inthanon" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="ex. This is a tour to Doi Inthanon"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxMemberCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Maximum number of people: <span>{field.value}</span>
                </FormLabel>
                <FormControl>
                  <Slider
                    defaultValue={[50]}
                    min={1}
                    max={100}
                    step={1}
                    className="w-[60%] py-4"
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Label>Activities</Label>
          {/* add a button to create more input for activities */}
          {fields.map((activity, index) => (
            <div className="flex gap-4" key={index}>
              {activityAPIinDEV && tourId ? (
                <Button
                  onClick={(e) => e.preventDefault()}
                  className="h-12 w-12 rounded-full text-2xl"
                >
                  {index + 1}
                </Button>
              ) : (
                <Button
                  onClick={() => remove(index)}
                  className="h-12 w-12 rounded-full text-2xl"
                >
                  -
                </Button>
              )}
              <div key={activity.id} className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name={`activities.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Activity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ex. Hiking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`activities.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Activity Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ex. Hiking in the mountains"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DateInput
                  form={form}
                  name={`activities.${index}.startTimestamp`}
                  label="Activity Start Date"
                  grow
                />
                <DateInput
                  form={form}
                  name={`activities.${index}.endTimestamp`}
                  label="Activity End Date"
                  grow
                />
                <FormField
                  control={form.control}
                  name={`activities.${index}.location.name`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ex. Doi Inthanon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`activities.${index}.location.latitude`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="-90" max="90" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`activities.${index}.location.longitude`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="-180" max="180" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`activities.${index}.location.type`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Location Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {location_types.map((type) => (
                            <SelectItem key={type + index * 10} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`activities.${index}.location.address`}
                  render={({ field }) => (
                    <FormItem className="flex grow flex-col">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex. 123/4 Doi Inthanon"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-start gap-4">
            {activityAPIinDEV && tourId ? null : (
              <>
                <Button
                  onClick={(e) => {
                    append({
                      name: "",
                      description: "",
                      startTimestamp: new Date(),
                      endTimestamp: new Date(),
                      location: {
                        name: "",
                        latitude: 0,
                        longitude: 0,
                        type: "Other",
                        address: "",
                      },
                    }),
                      e.preventDefault();
                  }}
                  className="h-12 w-12 rounded-full text-2xl"
                >
                  +
                </Button>
                <Label htmlFor="addActivity" className="text-slate-400">
                  Add activity
                </Label>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-4">
            <Label htmlFor="submitBtn" className="text-slate-400">
              {tourId ? "Update the tour!" : "Create new tour!"}
            </Label>
            <Button
              id="submitBtn"
              type="submit"
              className="h-12 w-12 rounded-full text-2xl"
            >
              +
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
