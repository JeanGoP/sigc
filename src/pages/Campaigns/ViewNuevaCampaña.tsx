import MultiSelectCheckBox from "@app/components/MultiSelectCheckBox/MultiSelectCheckBox";

export const ViewNuevaCampaña = () => {
  return (
    <div className="">
      <h1>Vista de Nueva Campaña</h1>

      <MultiSelectCheckBox
            options={edades}
            value={edad}
            onChange={setEdad}
            placeholder="Todas"
          />
    </div>
  );
}