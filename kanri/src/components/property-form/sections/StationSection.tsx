"use client";

import { Section } from "../Section";
import { Label, type EditData } from "../FormPrimitives";
import StationInput from "../../StationInput";

export default function StationSection({ editData }: { editData: EditData }) {
  return (
    <Section title="交通">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>最寄り駅①</Label>
          <StationInput
            name="nearest_station"
            idName="nearest_station_id"
            defaultValue={editData?.nearest_station || ""}
            defaultId={editData?.nearest_station_id || ""}
          />
        </div>
        <div>
          <Label>徒歩（分）</Label>
          <input
            name="walk_minutes"
            type="number"
            defaultValue={editData?.walk_minutes || ""}
            className="input"
            placeholder="例: 5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>最寄り駅②</Label>
          <StationInput
            name="nearest_station_2"
            idName="nearest_station_2_id"
            defaultValue={editData?.nearest_station_2 || ""}
            defaultId={editData?.nearest_station_2_id || ""}
          />
        </div>
        <div>
          <Label>徒歩（分）</Label>
          <input
            name="walk_minutes_2"
            type="number"
            defaultValue={editData?.walk_minutes_2 || ""}
            className="input"
            placeholder="例: 8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>最寄り駅③</Label>
          <StationInput
            name="nearest_station_3"
            idName="nearest_station_3_id"
            defaultValue={editData?.nearest_station_3 || ""}
            defaultId={editData?.nearest_station_3_id || ""}
          />
        </div>
        <div>
          <Label>徒歩（分）</Label>
          <input
            name="walk_minutes_3"
            type="number"
            defaultValue={editData?.walk_minutes_3 || ""}
            className="input"
            placeholder="例: 3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>バス停</Label>
          <input
            name="bus_station"
            defaultValue={editData?.bus_station || ""}
            className="input"
            placeholder="例: 西新宿バス停"
          />
        </div>
        <div>
          <Label>バス（分）</Label>
          <input
            name="bus_minutes"
            type="number"
            defaultValue={editData?.bus_minutes || ""}
            className="input"
            placeholder="例: 10"
          />
        </div>
      </div>
    </Section>
  );
}
