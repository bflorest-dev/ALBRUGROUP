export { NewApplicantForm } from '../../../features/RRHH/components/organisms/Forms/NewApplicantForm';

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneMobile">
            CELULAR PERSONAL <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="phoneMobile"
            name="phoneMobile"
            placeholder="Número de celular"
            value={formData.phoneMobile}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="positionOfInterest">
            PUESTO DE INTERÉS <span className="required">*</span>
          </label>
          <select
            id="positionOfInterest"
            name="positionOfInterest"
            value={formData.positionOfInterest}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un puesto</option>
            {Object.entries(AVAILABLE_POSITIONS_GROUPED).map(([category, positions]) => (
              <optgroup key={category} label={category}>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {category === 'RRHH' || category === 'CONTABILIDAD' || category === 'COMMUNITY' 
                      ? position 
                      : `  ${position}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="documentType">TIPO DE DOCUMENTO</label>
          <select
            id="documentType"
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
          >
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="documentNumber">
            Nº DOCUMENTO <span className="required">*</span>
          </label>
          <input
            type="text"
            id="documentNumber"
            name="documentNumber"
            placeholder="Número de documento"
            value={formData.documentNumber}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="campaign">
            CAMPAÑA <span className="required">*</span>
          </label>
          <select
            id="campaign"
            name="campaign"
            value={formData.campaign}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una campaña</option>
            <option value="COMPUTRABAJO">COMPUTRABAJO</option>
            <option value="INDEED">INDEED</option>
            <option value="REFERIDO">REFERIDO</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="company">COMPAÑÍA <span className="required">*</span></label>
          <select id="company" name="company" value={formData.company} onChange={handleChange} required>
            <option value="CLARO">CLARO</option>
            <option value="WIN">WIN</option>
          </select>
        </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="trainingDayPayment">PAGO DEL DÍA DE CAPACITACIÓN</label>
          <input
            type="number"
            id="trainingDayPayment"
            name="trainingDayPayment"
            placeholder="Monto en S/."
            value={formData.trainingDayPayment ?? ''}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">FECHA INICIO</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate ?? ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">FECHA FIN</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate ?? ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          CANCELAR
        </button>
        <button type="submit" className="btn-submit">
          + REGISTRAR POSTULANTE
        </button>
      </div>
    </form>
  );
};
