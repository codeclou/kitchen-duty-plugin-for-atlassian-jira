package it.com.comsysto.kitchen.duty.rest;

import com.comsysto.kitchen.duty.rest.BaseResource;
import org.junit.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.Assert.assertEquals;

public class BaseResourceTest {

    @Test
    public void testGetIsoWeeksOfMonth() {
        List<Long> isoWeeks = BaseResource.getIsoWeeksOfMonth(2018L, 8L);

        assertEquals(Long.valueOf(31), isoWeeks.get(0));
        assertEquals(Long.valueOf(32), isoWeeks.get(1));
        assertEquals(Long.valueOf(33), isoWeeks.get(2));
        assertEquals(Long.valueOf(34), isoWeeks.get(3));
        assertEquals(Long.valueOf(35), isoWeeks.get(4));

        List<Long> isoWeeks2 = BaseResource.getIsoWeeksOfMonth(2018L, 2L);

        assertEquals(Long.valueOf(6), isoWeeks2.get(0));
        assertEquals(Long.valueOf(7), isoWeeks2.get(1));
        assertEquals(Long.valueOf(8), isoWeeks2.get(2));
        assertEquals(Long.valueOf(9), isoWeeks2.get(3));
        assertEquals(Long.valueOf(10), isoWeeks2.get(4));

        List<Long> isoWeeks3 = BaseResource.getIsoWeeksOfMonth(2018L, 5L);

        assertEquals(Long.valueOf(18), isoWeeks3.get(0));
        assertEquals(Long.valueOf(19), isoWeeks3.get(1));
        assertEquals(Long.valueOf(20), isoWeeks3.get(2));
        assertEquals(Long.valueOf(21), isoWeeks3.get(3));
        assertEquals(Long.valueOf(22), isoWeeks3.get(4));
    }


    @Test
    public void testGetFirstDayOfWeekOfMonth() {
        LocalDate date = BaseResource.getFirstDayOfWeekOfYear(2018L, 32L);
        assertEquals("2018-08-05", date.toString());
    }

    @Test
    public void testGetLastDayOfWeekOfMonth() {
        LocalDate date = BaseResource.getLastDayOfWeekOfYear(2018L, 32L);
        assertEquals("2018-08-11", date.toString());
    }


}
