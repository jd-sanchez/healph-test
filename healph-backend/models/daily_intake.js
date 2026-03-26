const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const daily_intakeSchema = new Schema({
  uid: { type: Schema.ObjectId, ref: "User", required: true },
  date: { type: String, required: true, minLength: 9, maxLength: 11 },
  sleephrs: { type: Number, min: 0, required: true },
  waterglass: { type: Number, min: 0, required: true },
  dailycal: { type: Number, min: 0, required: true },
  steps: { type: Number, min: 0, required: true },
  hale: { type: Number, min: 0, required: true },
  mealDiversity: { type: Number, min: 0 },
  proteins: { type: Number, min: 0 },
  carbs: { type: Number, min: 0 },
  fats: { type: Number, min: 0 },
  fibers: { type: Number, min: 0 },
  sugars: { type: Number, min: 0 },
});

daily_intakeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Intake", daily_intakeSchema);
