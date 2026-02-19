export { NewEmployeeForm } from '../../../features/RRHH/components/organisms/Forms/NewEmployeeForm';

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nationality">NACIONALIDAD</label>
              <select
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              >
                <option value="Peruana">Peruana</option>
                <option value="Extranjera">Extranjera</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">FECHA NACIMIENTO</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="civilStatus">ESTADO CIVIL</label>
              <select
                id="civilStatus"
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
              >
                <option value="Soltero">Soltero</option>
                <option value="Casado">Casado</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viudo">Viudo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hasChildren">¿TIENE HIJOS?</label>
              <select
                id="hasChildren"
                name="hasChildren"
                value={formData.hasChildren ? 'true' : 'false'}
                onChange={handleChange}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="form-section">
          <h3>Información de Contacto</h3>
          
          <div className="form-group">
            <label htmlFor="district">
              DISTRITO <span className="required">*</span>
            </label>
            <input
              type="text"
              id="district"
              name="district"
              placeholder="Ingrese el distrito"
              value={formData.district}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">
              DIRECCIÓN <span className="required">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Ingrese la dirección"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneFixed">TELÉFONO FIJO</label>
            <input
              type="tel"
              id="phoneFixed"
              name="phoneFixed"
              placeholder="Teléfono fijo"
              value={formData.phoneFixed}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneMobile">CELULAR PERSONAL</label>
            <input
              type="tel"
              id="phoneMobile"
              name="phoneMobile"
              placeholder="Celular personal"
              value={formData.phoneMobile}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneWork">CELULAR TRABAJO</label>
            <input
              type="tel"
              id="phoneWork"
              name="phoneWork"
              placeholder="Celular trabajo"
              value={formData.phoneWork}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Información Bancaria */}
        <div className="form-section">
          <h3>Información Bancaria</h3>

          <div className="form-group">
            <label htmlFor="bank">BANCO</label>
            <select
              id="bank"
              name="bank"
              value={formData.bank}
              onChange={handleChange}
            >
              <option value="">Seleccionar banco...</option>
              <option value="BCP">BCP</option>
              <option value="INTERBANK">INTERBANK</option>
              <option value="BBVA">BBVA</option>
              <option value="SCOTIABANK">SCOTIABANK</option>
              <option value="OTROS">OTROS</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="accountNumber">NÚMERO DE CUENTA</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              placeholder="Número de cuenta"
              value={formData.accountNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="interbankNumber">Nº CUENTA INTERBANCARIA</label>
            <input
              type="text"
              id="interbankNumber"
              name="interbankNumber"
              placeholder="Número interbancario"
              value={formData.interbankNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="baseSalary">SUELDO BASE</label>
            <input
              type="text"
              id="baseSalary"
              name="baseSalary"
              placeholder="Ingrese el sueldo base"
              value={formData.baseSalary}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Información Laboral */}
        <div className="form-section">
          <h3>Información Laboral</h3>

          <div className="form-group">
            <label htmlFor="role">
              ROL <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar rol...</option>
              {Object.entries(AVAILABLE_POSITIONS_GROUPED).map(([category, positions]) => (
                <optgroup key={category} label={category}>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {category === 'RRHH' || category === 'CONTADOR' || category === 'COMMUNITY' 
                        ? position 
                        : `  ${position}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">FECHA INGRESO</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="modality">MODALIDAD <span className="required">*</span></label>
            <select
              id="modality"
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar modalidad...</option>
              <option value="PART TIME">PART TIME</option>
              <option value="SEMI FULL">SEMI FULL</option>
              <option value="FULL TIME">FULL TIME</option>
              <option value="SUPER FULL">SUPER FULL</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scheduleType">TIPO DE HORARIO</label>
            <select
              id="scheduleType"
              name="scheduleType"
              value={formData.scheduleType}
              onChange={handleChange}
            >
              <option value="">Seleccionar tipo de horario...</option>
              <option value="PRESENCIAL">PRESENCIAL</option>
              <option value="SEMIPRESENCIAL">SEMIPRESENCIAL</option>
              <option value="REMOTO">REMOTO</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="googleEmail">CORREO GOOGLE (PERFIL CHROME)</label>
            <input
              type="email"
              id="googleEmail"
              name="googleEmail"
              placeholder="correo@dominio.com"
              value={formData.googleEmail}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="form-actions">
        <button type="submit" className="btn-submit">
          + REGISTRAR EMPLEADO
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          CANCELAR
        </button>
      </div>
    </form>
  );
};
