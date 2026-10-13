import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Drive title is required"],
      trim: true,
    },
    organization: {
      type: String,
      required: [true, "Organization is required"],
      trim: true,
    },
    description: { type: String, default: "", trim: true },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Date must be YYYY-MM-DD"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      match: [/^[0-9]{2}:[0-9]{2}$/, "Time must be HH:MM"],
    },
    endTime: {
      type: String,
      default: "",
      match: [/^[0-9]{2}:[0-9]{2}$/, "End time must be HH:MM"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Shelter Care",
        "Adoption Drive",
        "Feeding Drive",
        "Vaccination",
        "Rescue",
        "Fundraising",
        "Other",
      ],
      default: "Other",
    },
    capacity: {
      type: Number,
      required: [true, "Volunteers needed is required"],
      min: [1, "Volunteers needed must be at least 1"],
    },
    registered: { type: Number, default: 0, min: 0 },
    whatToBring: { type: String, default: "", trim: true },
    experience: {
      type: String,
      enum: ["None", "Beginner", "Experienced"],
      default: "None",
    },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    cancelReason: { type: String, default: "", trim: true },
    seriesId: { type: String, default: "" },
    announcements: { type: [announcementSchema], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: { type: String, required: [true, "Image is required"] },
  },
  { timestamps: true },
);

eventSchema.index({ date: 1, time: 1 });

export default mongoose.model("Event", eventSchema);